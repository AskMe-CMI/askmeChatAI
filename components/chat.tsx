'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { AuthResponse } from '@/app/(auth)/auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  // Accept either the whole AuthResponse or just the user object for flexibility
  session: AuthResponse | NonNullable<AuthResponse>['user'];
  autoResume: boolean;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>('');
  // Track the actual chat ID (Backend session ID) after first message
  const [actualChatId, setActualChatId] = useState<string>(id);
  // Track the current model for mid-chat model switching
  const [currentModel, setCurrentModel] = useState<string>(initialChatModel);
  // Store message metadata separately to avoid being overwritten by streaming
  // Key by message ID to preserve metadata for previous messages
  const [messageMetadata, setMessageMetadata] = useState<Record<string, { usage?: any; model?: string; createdAt?: string }>>({});
  // Track the latest assistant message ID for applying incoming metadata (useRef to avoid closure issues)
  const latestAssistantIdRef = useRef<string | null>(null);

  // Handle model change mid-chat
  const handleModelChange = (newModelId: string) => {
    console.log('🔄 Model changed mid-chat:', { from: currentModel, to: newModelId });
    setCurrentModel(newModelId);
  };

  // Initialize messageMetadata from initialMessages on mount
  // This preserves metadata (createdAt, usage, model) from history when new messages are sent
  useEffect(() => {
    const initialMetadata: Record<string, { usage?: any; model?: string; createdAt?: string }> = {};
    initialMessages.forEach((m) => {
      if (m.role === 'assistant' && (m.usage || (m as any).model || m.createdAt)) {
        initialMetadata[m.id] = {
          usage: m.usage,
          model: (m as any).model,
          createdAt: typeof m.createdAt === 'string' ? m.createdAt : m.createdAt?.toISOString(),
        };
      }
    });
    if (Object.keys(initialMetadata).length > 0) {
      setMessageMetadata(prev => ({ ...initialMetadata, ...prev }));
    }
  }, [initialMessages]);

  // Debug: Log initial messages when loading history
  useEffect(() => {
    console.log('🔍 Chat component mounted with:', {
      id,
      initialMessagesCount: initialMessages.length,
    });
    // Log each message separately for better visibility
    initialMessages.forEach((m, i) => {
      const textContent = m.parts?.find((p: any) => p.type === 'text')?.text || '';
      console.log(`📝 Message[${i}]:`, {
        id: m.id,
        role: m.role,
        text: textContent.substring(0, 100),
      });
    });
  }, [id, initialMessages]);


  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({
        messages,
        id,
        body,
      }: { messages: any[]; id: string; body?: any }) {
        return {
          body: {
            id: actualChatId,
            message: messages.at(-1),
            selectedChatModel: currentModel,
            selectedVisibilityType: visibilityType,
            ...body,
          },
        };
      },
    }),
    onData: (dataPart: any) => {
      console.log('📨 Chat onData received:', dataPart);
      setDataStream((ds: any[] | null) => (ds ? [...ds, dataPart] : []));

      // Handle data-chatId event - update URL to Backend session ID
      if (dataPart && dataPart.type === 'data-chatId' && dataPart.data) {
        try {
          const parsed = JSON.parse(dataPart.data);
          if (parsed.chatId && parsed.chatId !== id) {
            console.log('🔄 Updating URL to Backend session ID:', parsed.chatId);
            setActualChatId(parsed.chatId);
            window.history.replaceState({}, '', `/chat/${parsed.chatId}`);
          }
        } catch (e) {
          console.error('Failed to parse chatId data:', e);
        }
      }

      // Handle data-token-usage event - store metadata temporarily keyed by 'pending'
      if (dataPart && dataPart.type === 'data-token-usage' && dataPart.data) {
        try {
          const usageData = JSON.parse(dataPart.data);
          console.log('📊 Token usage received:', usageData);
          // Store metadata keyed by 'pending' - will be moved to message ID in onFinish
          setMessageMetadata(prev => ({
            ...prev,
            pending: {
              usage: {
                prompt_tokens: usageData.prompt_tokens,
                completion_tokens: usageData.completion_tokens,
                total_tokens: usageData.total_tokens,
              },
              model: usageData.model,
              createdAt: usageData.createdAt || new Date().toISOString(),
            },
          }));
        } catch (e) {
          console.error('Failed to parse token usage data:', e);
        }
      }
    },
    onFinish: (response) => {
      console.log('🏁 Chat onFinish fired');
      // Move pending metadata to the actual message ID
      setMessageMetadata(prev => {
        if (!prev.pending) return prev;
        // Find the last assistant message ID from ref (not state, to avoid closure issues)
        const lastAssistantId = latestAssistantIdRef.current;
        if (lastAssistantId) {
          console.log('📊 Storing metadata for message:', lastAssistantId);
          const { pending, ...rest } = prev;
          return {
            ...rest,
            [lastAssistantId]: pending,
          };
        }
        return prev;
      });
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error: unknown) => {
      console.error('❌ Chat onError:', error);
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    // console.log('🎯 Chat useEffect query:', {
    //   query,
    //   hasAppendedQuery,
    //   id,
    //   action: 'checking-if-should-send-query',
    // });

    if (query && !hasAppendedQuery) {
      console.log('🎯 Chat sending initial query message:', {
        query,
        id,
        action: 'sending-message',
      });

      sendMessage({
        role: 'user' as const,
        createdAt: new Date().toISOString(),
        parts: [{ type: 'text', text: query }],
      });

      setHasAppendedQuery(true);

      // Note: URL update is now handled in onData when Backend session ID is received
      console.log('🎯 Chat message sent, waiting for Backend session ID');
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  // Track URL changes to debug navigation
  // useEffect(() => {
  //   const currentUrl = window.location.href;
  //   console.log('🌐 URL Tracker:', {
  //     url: currentUrl,
  //     chatId: id,
  //     pathname: window.location.pathname,
  //     timestamp: new Date().toISOString(),
  //   });
  // });

  // Track when component ID changes
  // useEffect(() => {
  //   console.log('🔄 Chat ID Changed:', {
  //     id,
  //     pathname: window.location.pathname,
  //     timestamp: new Date().toISOString(),
  //   });
  // }, [id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  const sessionUser: NonNullable<AuthResponse>['user'] | null =
    (session && 'user' in (session as any)
      ? (session as any).user
      : (session as any)) || null;

  // Track the latest assistant message ID for metadata association
  useEffect(() => {
    const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
    if (lastAssistant) {
      latestAssistantIdRef.current = lastAssistant.id;
    }
  }, [messages]);

  // Merge metadata into messages - apply stored metadata per message ID
  // For 'pending' metadata, apply to the last assistant message (still streaming)
  const messagesWithMetadata = useMemo(() => {
    const hasStoredMetadata = Object.keys(messageMetadata).some(key => key !== 'pending');
    const hasPending = !!messageMetadata.pending;

    if (!hasStoredMetadata && !hasPending) return messages;

    return messages.map((msg, index) => {
      if (msg.role !== 'assistant') return msg;

      // Check if we have stored metadata for this message ID
      const storedMeta = messageMetadata[msg.id];
      if (storedMeta) {
        return {
          ...msg,
          usage: storedMeta.usage || msg.usage,
          model: storedMeta.model || (msg as any).model,
          createdAt: storedMeta.createdAt || msg.createdAt,
        } as ChatMessage;
      }

      // For the last assistant message, apply 'pending' metadata if available
      const isLastAssistant = index === messages.length - 1 ||
        !messages.slice(index + 1).some(m => m.role === 'assistant');
      if (isLastAssistant && hasPending) {
        return {
          ...msg,
          usage: messageMetadata.pending!.usage || msg.usage,
          model: messageMetadata.pending!.model || (msg as any).model,
          createdAt: messageMetadata.pending!.createdAt || msg.createdAt,
        } as ChatMessage;
      }

      return msg;
    });
  }, [messages, messageMetadata]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh">
        <ChatHeader
          chatId={id}
          selectedModelId={currentModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={sessionUser as any}
          onModelChange={handleModelChange}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messagesWithMetadata}
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <div className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              sendMessage={sendMessage}
              selectedVisibilityType={visibilityType}
            />
          )}
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={sendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}
