import { auth } from '@/app/(auth)/auth';
import { getChatById, saveChat, saveMessage } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import type { NextRequest } from 'next/server';

// Declare Node.js globals
declare const process: any;

// Dify conversation detail response
interface DifyConversationDetail {
  id: string;
  name: string;
  inputs: Record<string, any>;
  status: string;
  introduction: string;
  created_at: number;
  updated_at: number;
}

// Dify message response
interface DifyMessage {
  id: string;
  conversation_id: string;
  inputs: Record<string, any>;
  query: string;
  answer: string;
  message_files: Array<{
    id: string;
    type: string;
    url: string;
    belongs_to: string;
  }>;
  feedback: {
    rating: string;
  };
  retriever_resources: any[];
  created_at: number;
  updated_at: number;
}

interface DifyMessagesResponse {
  limit: number;
  has_more: boolean;
  data: DifyMessage[];
}

// Transform Dify message to our UI format
function transformDifyMessageToUI(message: DifyMessage) {
  const messages = [];

  // Helper function to clean text from <think> tags
  const cleanText = (text: string) => {
    return text
      .replace(/<think>[\s\S]*?<\/think>\s*/gi, '')
      .replace(/<\/?think[^>]*>\s*/gi, '')
      .trim();
  };

  // User message
  if (message.query) {
    messages.push({
      id: `${message.id}-user`,
      role: 'user' as const,
      parts: [{ type: 'text', text: cleanText(message.query) }],
      attachments:
        message.message_files?.map((file) => ({
          name: file.id,
          url: file.url,
          contentType: file.type,
        })) || [],
      createdAt: new Date(message.created_at * 1000),
    });
  }

  // Assistant message
  if (message.answer) {
    messages.push({
      id: `${message.id}-assistant`,
      role: 'assistant' as const,
      parts: [{ type: 'text', text: cleanText(message.answer) }],
      attachments: [],
      createdAt: new Date(message.updated_at * 1000),
    });
  }

  return messages;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    const userEmail = session.user.email || session.user.id;

    console.log('Chat API - Fetching chat:', { id, userEmail });

    // First, get the chat from our database to find the conversation ID
    const chat = await getChatById({ id });

    let conversationId: string;

    if (!chat) {
      console.log(
        'Chat API - Chat not found in database, trying Dify API with chat ID as conversation ID:',
        id,
      );
      // Fallback: try using the chat ID as conversation ID directly
      conversationId = id;
    } else if (!chat.conversationId) {
      console.log(
        'Chat API - No conversation ID found for chat, trying chat ID:',
        id,
      );
      // Fallback: try using the chat ID as conversation ID
      conversationId = id;
    } else {
      conversationId = chat.conversationId;
      console.log('Chat API - Found conversation ID:', {
        chatId: id,
        conversationId: chat.conversationId,
      });
    }

    // Get messages from Dify using the correct conversation ID
    const rawBase = process.env.DIFY_BASE_URL || 'https://dify.askme.co.th/v1';
    const baseWithSlash = `${rawBase.replace(/\/+$/, '')}/`;
    const messagesUrl = new URL('messages', baseWithSlash);
    messagesUrl.searchParams.set('conversation_id', conversationId);
    messagesUrl.searchParams.set('user', userEmail);
    messagesUrl.searchParams.set('limit', '100'); // Get all messages

    console.log(
      'Chat API - Calling Dify messages URL:',
      messagesUrl.toString(),
    );

    const messagesResponse = await fetch(messagesUrl.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(
      'Chat API - Messages response status:',
      messagesResponse.status,
    );

    if (!messagesResponse.ok) {
      const text = await messagesResponse.text().catch(() => '');
      console.error('Dify messages error:', messagesResponse.status, text);
      if (messagesResponse.status === 404) {
        return new ChatSDKError('not_found:chat').toResponse();
      }
      if (messagesResponse.status === 401) {
        return new ChatSDKError(
          'unauthorized:chat',
          'Dify API unauthorized (check DIFY_API_KEY)',
        ).toResponse();
      }
      return new ChatSDKError(
        'bad_request:api',
        `Dify messages API error: ${messagesResponse.status}`,
      ).toResponse();
    }

    const messagesData: DifyMessagesResponse = await messagesResponse.json();

    console.log('Chat API - Messages response:', {
      totalMessages: messagesData.data.length,
    });

    // If no messages found, conversation doesn't exist
    if (messagesData.data.length === 0) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    // Create conversation object from first message data
    const firstMessage = messagesData.data[0];
    const conversationData: DifyConversationDetail = {
      id: firstMessage.conversation_id,
      name: `Chat ${id.substring(0, 8)}`, // Default name since we can't get it from API
      inputs: {},
      status: 'normal',
      introduction: '',
      created_at: firstMessage.created_at,
      updated_at: Math.max(...messagesData.data.map((m) => m.created_at)),
    };

    // Transform data to our format
    const chatData = {
      id: conversationData.id,
      title: conversationData.name || 'Untitled Chat',
      userId: userEmail,
      visibility: 'private' as const,
      createdAt: new Date(conversationData.created_at * 1000),
      updatedAt: new Date(conversationData.updated_at * 1000),
    };

    // Transform and flatten messages
    const uiMessages = messagesData.data
      .sort((a, b) => a.created_at - b.created_at) // Sort by creation time
      .flatMap(transformDifyMessageToUI);

    // 🔥 CRITICAL FIX: Save chat and messages to local database for conversation continuity
    console.log(
      '💾 Saving chat to local database with conversation ID:',
      conversationData.id,
    );

    try {
      // Save chat with the correct conversation ID
      const savedChat = await saveChat({
        id: conversationData.id, // Use conversation ID as chat ID
        title: chatData.title,
        userId: userEmail,
        visibility: 'private',
        conversationId: conversationData.id, // Store conversation ID for API calls
      });

      // Save all messages to local database
      for (const message of uiMessages) {
        await saveMessage({
          chatId: conversationData.id, // Link to chat ID
          role: message.role,
          parts: message.parts, // Already in correct format from transformDifyMessageToUI
          attachments: message.attachments || [], // Already in correct format
        });
      }

      console.log('✅ Chat and messages saved to local database successfully');
    } catch (error) {
      console.error('❌ Error saving chat to local database:', error);
      // Continue anyway, as the data is still accessible from Dify
    }

    return Response.json({
      chat: chatData,
      messages: uiMessages,
    });
  } catch (error) {
    console.error('Error fetching chat from Dify:', error);
    return new ChatSDKError(
      'bad_request:api',
      'Failed to fetch chat from Dify API',
    ).toResponse();
  }
}
