import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { getStoredToken } from '@/lib/auth/local-auth';
import type { NextRequest } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL;

// Backend session detail response
interface BackendSession {
  id: number;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
  messages: BackendMessage[];
}

// Backend attachment response
interface BackendAttachment {
  type: 'image' | 'file';
  url: string;
  filename?: string;
  content_type?: string;
}

// Backend message response
interface BackendMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  tokens?: number;
  created_at: string;
  attachments?: BackendAttachment[];
}

// Transform backend message to our UI format
function transformBackendMessageToUI(message: BackendMessage) {
  // Build parts array starting with text content
  const parts: Array<{
    type: string;
    text?: string;
    url?: string;
    filename?: string;
    mediaType?: string;
  }> = [];

  // Add text part if content exists
  if (message.content) {
    parts.push({ type: 'text', text: message.content });
  }

  // Add file parts for attachments (images, files)
  if (message.attachments && message.attachments.length > 0) {
    for (const attachment of message.attachments) {
      // Derive mediaType from content_type, or infer from type field
      let mediaType = attachment.content_type;
      if (!mediaType && (attachment.type === 'image')) {
        // Default to image/jpeg if no content_type but type is 'image'
        mediaType = 'image/jpeg';
      }

      parts.push({
        type: 'file',
        url: attachment.url,
        filename: attachment.filename || 'attachment',
        mediaType,
      });
    }
  }

  return {
    id: String(message.id),
    role: message.role as 'user' | 'assistant',
    parts,
    attachments: [],
    createdAt: new Date(message.created_at),
    model: message.model, // Include model for displaying in UI
    usage: message.tokens ? {
      prompt_tokens: 0, // Backend logic might not separate them in list view, assuming total or unavailable
      completion_tokens: message.tokens, // Assigning total to completion or just total
      total_tokens: message.tokens,
    } : undefined,
  };
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

  // Get token for Backend API
  const token = await getStoredToken();
  if (!token) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    const userEmail = session.user.email || session.user.id;

    console.log('Chat API - Fetching chat from Backend:', { id, userEmail });

    // Call Backend API to get session with messages
    const backendUrl = `${BACKEND_API_URL}/api/chat-history/sessions/${id}`;

    console.log('Chat API - Calling Backend URL:', backendUrl);

    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Chat API - Backend response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        return new ChatSDKError('not_found:chat').toResponse();
      }
      if (response.status === 401) {
        return new ChatSDKError('unauthorized:chat').toResponse();
      }
      return new ChatSDKError(
        'bad_request:api',
        `Backend API error: ${response.status}`,
      ).toResponse();
    }

    const sessionData: BackendSession = await response.json();

    console.log('Chat API - Backend session response:', {
      sessionId: sessionData.id,
      title: sessionData.title,
      messageCount: sessionData.messages?.length || 0,
    });

    // Transform data to our format
    const chatData = {
      id: String(sessionData.id),
      title: sessionData.title || 'Untitled Chat',
      userId: userEmail,
      model: sessionData.model,
      visibility: 'private' as const,
      createdAt: new Date(sessionData.created_at),
      updatedAt: new Date(sessionData.updated_at),
    };

    // Transform messages
    const uiMessages = (sessionData.messages || [])
      .map(transformBackendMessageToUI)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    console.log('Chat API - Returning chat data:', {
      chatId: chatData.id,
      messageCount: uiMessages.length,
    });

    return Response.json({
      chat: chatData,
      messages: uiMessages,
    });
  } catch (error) {
    console.error('Error fetching chat from Backend API:', error);
    return new ChatSDKError(
      'bad_request:api',
      'Failed to fetch chat from Backend API',
    ).toResponse();
  }
}
