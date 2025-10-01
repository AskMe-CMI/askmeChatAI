import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';

// Declare Node.js globals
declare const process: any;
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { difyModel } from '@/lib/ai/dify-provider';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    const session = await auth();

    console.log('📧 Chat API Debug - Session and Request:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      requestedChatId: id,
    });

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.email, // Use email for consistency
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    console.log('📝 Chat API Debug - Chat Lookup:', {
      requestedId: id,
      foundChat: chat
        ? {
            id: chat.id,
            userId: chat.userId,
            title: chat.title,
          }
        : null,
      sessionUserEmail: session.user.email,
    });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      console.log('🆕 Creating new chat with:', {
        id,
        userId: session.user.email,
        title,
        visibility: selectedVisibilityType,
      });

      await saveChat({
        id,
        userId: session.user.email, // Use email for consistency with /api/chat/[id]
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      // 🔥 FIX: Compare with email instead of id for consistency
      if (chat.userId !== session.user.email) {
        console.error('🚫 Chat access denied:', {
          chatUserId: chat.userId,
          sessionUserEmail: session.user.email,
          sessionUserId: session.user.id,
        });
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    // Helper: convert UI parts to DB parts accepted by saveMessages
    function uiPartsToDbParts(parts: typeof message.parts | undefined) {
      if (!parts) return [];

      return parts.map((p) => {
        // text part
        if ((p as any).type === 'text') {
          return (p as any).text ?? '';
        }

        // source/url part -> store as text with URL
        if ((p as any).type === 'source-url') {
          return { text: (p as any).url ?? '' };
        }

        // fallback
        return '';
      });
    }

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: uiPartsToDbParts(message.parts),
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    // Use AI SDK with Dify provider for better integration
    const DIFY_BASE_URL = process.env.DIFY_BASE_URL;
    const DIFY_API_KEY = process.env.DIFY_API_KEY;
    const DIFY_APP_ID = process.env.DIFY_APP_ID;

    // Validate Dify configuration
    console.log('🔍 Dify Configuration Validation:', {
      hasApiKey: !!DIFY_API_KEY,
      hasAppId: !!DIFY_APP_ID,
      hasBaseUrl: !!DIFY_BASE_URL,
      apiKeyPrefix: DIFY_API_KEY?.substring(0, 15),
      appIdPrefix: DIFY_APP_ID?.substring(0, 15),
      baseUrl: DIFY_BASE_URL,
      apiKeyValid: DIFY_API_KEY?.startsWith('app-'),
      appIdValid: DIFY_APP_ID?.startsWith('app-'),
    });

    if (!DIFY_API_KEY) {
      console.warn(
        'DIFY_API_KEY not configured, falling back to default provider',
      );
    } else if (!DIFY_API_KEY.startsWith('app-')) {
      console.error('Invalid DIFY_API_KEY format. Must start with "app-"', {
        apiKey: DIFY_API_KEY,
        prefix: DIFY_API_KEY.substring(0, 5),
      });
      return new ChatSDKError(
        'bad_request:api',
        'Invalid Dify API key format',
      ).toResponse();
    }

    if (!DIFY_APP_ID) {
      console.warn('DIFY_APP_ID not configured, using default app ID');
    } else if (!DIFY_APP_ID.startsWith('app-')) {
      console.error('Invalid DIFY_APP_ID format. Must start with "app-"', {
        appId: DIFY_APP_ID,
        prefix: DIFY_APP_ID.substring(0, 5),
      });
      return new ChatSDKError(
        'bad_request:api',
        'Invalid Dify App ID format',
      ).toResponse();
    }

    if (DIFY_BASE_URL && DIFY_API_KEY) {
      try {
        console.log(
          '🚀 Using Dify provider for chat with user:',
          session.user.email || session.user.id,
        );

        // Use existing conversation ID from database for chat continuity
        // Refetch chat to ensure we have the latest conversationId
        const latestChat = await getChatById({ id });
        let existingConversationId = latestChat?.conversationId;

        // If we don't have a conversation ID yet, check if we saved one recently
        // This handles the case where a new message is sent before the database is updated
        if (!existingConversationId && latestChat) {
          // Force a small delay and refetch to ensure we get the latest data
          await new Promise((resolve) => setTimeout(resolve, 100));
          const recheckChat = await getChatById({ id });
          existingConversationId = recheckChat?.conversationId;
        }

        console.log('🔍 Dify Debug:', {
          chatId: id,
          existingConversationId,
          userEmail: session.user.email,
          messageCount: uiMessages.length,
          chatFound: !!latestChat,
          chatData: latestChat
            ? {
                id: latestChat.id,
                title: latestChat.title,
                conversationId: latestChat.conversationId,
              }
            : null,
        });

        // Use streamText directly for simpler streaming
        console.log('🎬 Starting Dify streamText execution...');

        try {
          console.log('📋 Headers being sent to Dify:', {
            'user-id': session.user.email || session.user.id,
            'chat-id': existingConversationId || 'NEW_CONVERSATION',
            hasExistingId: !!existingConversationId,
          });

          const result = streamText({
            model: difyModel,
            messages: convertToModelMessages(uiMessages),
            headers: {
              'user-id': session.user.email || session.user.id,
              // Add chat-id for conversation continuity (required by dify-ai-provider)
              ...(existingConversationId && {
                'chat-id': existingConversationId,
              }),
            },
            onStart: () => {
              console.log('🎪 StreamText onStart fired');
            },
            onFinish: async (result: any) => {
              console.log('🏁 StreamText onFinish fired');

              // Extract conversation_id and message_id from provider metadata
              const conversationId =
                result.providerMetadata?.difyWorkflowData?.conversationId;
              const messageId =
                result.providerMetadata?.difyWorkflowData?.messageId;

              // Clean up AI response by removing metadata/reasoning text
              let cleanedText = result.text || '';
              const originalText = cleanedText;

              console.log('🧹 Before cleaning:', {
                originalLength: originalText.length,
                hasThinkTags: originalText.includes('<think>'),
                preview: `${originalText.substring(0, 200)}...`,
              });

              // Remove common AI reasoning patterns
              const reasoningPatterns = [
                /^This question is asking for.*?\.\s*/i,
                /^I do not need to use a tool for this.*?\.\s*/i,
                /^Based on the provided context.*?\.\s*/i,
                /^The answer can be derived from.*?\.\s*/i,
                // Remove <think>...</think> tags and their content
                /<think>[\s\S]*?<\/think>\s*/gi,
                // Remove any remaining think tags that might be malformed
                /<\/?think[^>]*>\s*/gi,
              ];

              reasoningPatterns.forEach((pattern, index) => {
                const beforeReplace = cleanedText;
                cleanedText = cleanedText.replace(pattern, '');
                if (beforeReplace !== cleanedText) {
                  console.log(`🔄 Pattern ${index} matched and replaced`);
                }
              });

              // Trim any extra whitespace
              cleanedText = cleanedText.trim();

              console.log('🧹 After cleaning:', {
                cleanedLength: cleanedText.length,
                hasThinkTags: cleanedText.includes('<think>'),
                preview: `${cleanedText.substring(0, 200)}...`,
                wasChanged: originalText !== cleanedText,
              });

              console.log('✅ Dify Response Metadata:', {
                chatId: id,
                conversationId,
                messageId,
                originalLength: result.text?.length || 0,
                cleanedLength: cleanedText.length,
                fullText: `${cleanedText.substring(0, 100)}...`, // First 100 chars
              });

              if (conversationId) {
                const chatToSave = {
                  id,
                  userId: session.user.email, // Use email for consistency
                  title: latestChat?.title ?? 'สร้างแชทใหม่',
                  visibility: latestChat?.visibility ?? 'private',
                  conversationId,
                  messageId,
                };

                console.log('💾 Saving chat with data:', chatToSave);

                await saveChat(chatToSave);

                console.log(
                  '💾 Chat updated with Dify conversation ID:',
                  conversationId,
                );

                // Verify the save worked
                const verifyChat = await getChatById({ id });
                console.log('✅ Verification - Chat after save:', {
                  id: verifyChat?.id,
                  conversationId: verifyChat?.conversationId,
                  title: verifyChat?.title,
                });
              }

              await saveMessages({
                messages: [
                  {
                    chatId: id,
                    id: generateUUID(),
                    role: 'user',
                    parts: uiPartsToDbParts(message.parts),
                    attachments: [],
                    createdAt: new Date(),
                  },
                  {
                    chatId: id,
                    id: generateUUID(),
                    role: 'assistant',
                    parts: [{ text: cleanedText }], // Use cleaned text
                    attachments: [],
                    createdAt: new Date(),
                  },
                ],
              });

              console.log('💬 Messages saved (user + assistant)');
            },
            onError: (error: any) => {
              console.error('❌ StreamText onError fired:', {
                error,
                message: error?.message,
                stack: error?.stack,
                name: error?.name,
                cause: error?.cause,
              });
            },
          });

          // Convert to UI message stream with proper error handling
          const stream = result.toUIMessageStream({
            sendReasoning: true,
            generateId: generateUUID,
          });

          console.log('✅ Stream created successfully');

          // Return the streaming response
          return new Response(
            stream.pipeThrough(new JsonToSseTransformStream()),
          );
        } catch (streamError) {
          console.error('❌ Error in streamText setup:', {
            error: streamError,
            message:
              streamError instanceof Error
                ? streamError.message
                : 'Unknown error',
            stack:
              streamError instanceof Error ? streamError.stack : 'No stack',
            name: streamError instanceof Error ? streamError.name : 'Unknown',
            chatId: id,
          });

          // Return error response immediately
          return new ChatSDKError(
            'offline:chat',
            'Dify streaming failed',
          ).toResponse();
        }
      } catch (err) {
        const cause = String(err);
        console.error('❌ Dify provider call failed:', {
          error: err,
          cause,
          stack: err instanceof Error ? err.stack : 'No stack trace',
          message: err instanceof Error ? err.message : 'Unknown error',
          // Check if it's an AggregateError
          errors: err instanceof AggregateError ? err.errors : undefined,
          chatId: id,
          userEmail: session.user.email || session.user.id,
          difyConfig: {
            baseUrl: DIFY_BASE_URL,
            hasApiKey: !!DIFY_API_KEY,
            hasAppId: !!DIFY_APP_ID,
            apiKeyPrefix: `${DIFY_API_KEY?.substring(0, 10)}...`,
            appIdPrefix: `${DIFY_APP_ID?.substring(0, 10)}...`,
          },
        });

        // If debug mode is enabled, return detailed error
        if (process.env.DEBUG_DIFY === 'true') {
          const errorDetails =
            err instanceof AggregateError
              ? `AggregateError with ${err.errors.length} errors: ${err.errors.map((e) => e.message).join(', ')}`
              : err instanceof Error
                ? err.message
                : String(err);
          return new ChatSDKError('offline:chat', errorDetails).toResponse();
        }

        return new ChatSDKError('offline:chat').toResponse();
      }
    }

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }: { writer: any }) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }: { messages: any[] }) => {
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: (message.role === 'system' ? 'assistant' : message.role) as
              | 'user'
              | 'assistant'
              | 'system',
            parts: uiPartsToDbParts(message.parts as any),
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Unexpected error: log and return a 503-style offline error response
    console.error('Unexpected error in POST /api/chat:', error);
    return new ChatSDKError('offline:chat').toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  let chat = await getChatById({ id });

  // If chat not found in local DB, try to get it from Dify API
  if (!chat) {
    console.log(
      '🔍 Chat not found in local DB, checking Dify API for conversation:',
      id,
    );

    try {
      // Try to fetch messages from Dify API using the chat ID as conversation ID
      const difyMessagesResponse = await fetch(
        `https://dify.askme.co.th/v1/messages?conversation_id=${id}&user=${encodeURIComponent(session.user.email)}&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
          },
        },
      );

      if (difyMessagesResponse.ok) {
        console.log(
          '✅ Found conversation in Dify API, treating as valid chat',
        );
        // Create a minimal chat object for deletion
        chat = {
          id,
          userId: session.user.email,
          title: `Chat ${id.substring(0, 8)}`,
          conversationId: id,
          visibility: 'private' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    } catch (error) {
      console.error('❌ Error checking Dify API:', error);
    }
  }

  if (!chat || chat.userId !== session.user.email) {
    console.error('🚫 Chat access denied or not found:', {
      chatFound: !!chat,
      chatUserId: chat?.userId,
      sessionUserEmail: session.user.email,
      requestedId: id,
    });
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  // 🗑️ Delete from Dify API if conversation ID exists
  if (chat.conversationId) {
    try {
      console.log('🗑️ Deleting Dify conversation:', {
        conversationId: chat.conversationId,
        user: session.user.email,
      });

      const difyDeleteResponse = await fetch(
        `https://dify.askme.co.th/v1/conversations/${chat.conversationId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: session.user.email,
          }),
        },
      );

      if (difyDeleteResponse.ok) {
        console.log('✅ Dify conversation deleted successfully');
      } else {
        console.error('❌ Dify delete failed:', {
          status: difyDeleteResponse.status,
          statusText: difyDeleteResponse.statusText,
        });
      }
    } catch (error) {
      console.error('❌ Error deleting Dify conversation:', error);
      // Continue with local deletion anyway
    }
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
