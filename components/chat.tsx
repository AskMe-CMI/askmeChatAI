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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getUsageStatsAction } from '@/app/(auth)/api-actions';

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
  // Use ref to avoid stale closure in prepareSendMessagesRequest
  const currentModelRef = useRef<string>(initialChatModel);
  // Store message metadata separately to avoid being overwritten by streaming
  // Key by message ID to preserve metadata for previous messages
  const [messageMetadata, setMessageMetadata] = useState<Record<string, { usage?: any; model?: string; createdAt?: string }>>({});
  // Track the latest assistant message ID for applying incoming metadata (useRef to avoid closure issues)
  const latestAssistantIdRef = useRef<string | null>(null);
  // Credit limit modal state
  const [showCreditLimitModal, setShowCreditLimitModal] = useState(false);
  const [creditLimitMessage, setCreditLimitMessage] = useState('');
  // Track if credit is exhausted (for disabling input on page load)
  const [isCreditExhausted, setIsCreditExhausted] = useState(false);
  // Track if account is expired
  const [isExpired, setIsExpired] = useState(false);

  // Handle model change mid-chat
  const handleModelChange = (newModelId: string) => {
    console.log('🔄 Model changed mid-chat:', { from: currentModel, to: newModelId });
    setCurrentModel(newModelId);
    currentModelRef.current = newModelId; // Update ref for transport closure
  };

  // Check credit on page load/refresh
  useEffect(() => {
    const checkCredit = async () => {
      try {
        const result = await getUsageStatsAction();
        if (result.success && result.data) {
          const remainingPercent = 100 - (result.data.tokens.percentage_used || 0);
          const limitExpired = result.data.status.limit_expired || false;
          console.log('💰 Initial expired_date:', result.data.status.expired_date );
          console.log('💰 Initial now_date:', result.data.status.now_date );
          // console.log('💰 Initial days_diff:', result.data.status.expired_date > result.data.status.now_date );
          console.log('💰 Initial credit check:', { remainingPercent, limitExpired, expiry_date: result.data.tokens.expiry_date });
          
          // Check if we already showed the modal in this session
          // Use global key for expired accounts, per-chat key for credit exhausted
          const expiredModalKey = 'credit_expired_modal_shown';
          const creditModalKey = `credit_modal_shown_${id}`;
          
          // Check if expired first
            if (limitExpired) {
            setIsExpired(true);
            setIsCreditExhausted(true);
            setInput(''); // Clear any existing input
            const alreadyShownExpired = sessionStorage.getItem(expiredModalKey);
            // Show if not shown in session OR if this is a fresh chat page (New Chat)
            if (!alreadyShownExpired || initialMessages.length === 0) {
              sessionStorage.setItem(expiredModalKey, 'true');
              setShowCreditLimitModal(true); 
            }
          } else if (remainingPercent <= 0) {
            setIsCreditExhausted(true);
            setInput(''); // Clear any existing input
            const alreadyShownCredit = sessionStorage.getItem(creditModalKey);
            if (!alreadyShownCredit) {
              sessionStorage.setItem(creditModalKey, 'true');
              setShowCreditLimitModal(true); // Show modal only once per session
            }
          }
        }
      } catch (error) {
        console.error('⚠️ Failed to check credit on load:', error);
      }
    };
    checkCredit();
  }, [id]);

  // Initialize messageMetadata from initialMessages on mount
  // This preserves metadata (createdAt, usage, model) from history when new messages are sent
  useEffect(() => {
    const initialMetadata: Record<string, { usage?: any; model?: string; createdAt?: string }> = {};
    initialMessages.forEach((m) => {
      if (m.role === 'assistant' && (m.usage || m.model || m.createdAt)) {
        initialMetadata[m.id] = {
          usage: m.usage,
          model: m.model,
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
      api: '/api-i/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({
        messages,
        id,
        body,
      }: { messages: any[]; id: string; body?: any }) {
        console.log('📤 Preparing request with model:', currentModelRef.current);
        return {
          body: {
            id: actualChatId,
            message: messages.at(-1),
            selectedChatModel: currentModelRef.current,
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
    onFinish: (response: ChatMessage) => {
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
      // Dispatch event to update credit stats
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('credit-updated'));
      }
    },
    onError: (error: unknown) => {
      console.error('❌ Chat onError:', error);

      // Check for credit limit error (429 with Thai message)
      if (error instanceof ChatSDKError) {
        const errorCause = (error as any).cause;
        const errorMessage = error.message || '';

        // Check if this is a credit limit or expiration error
        const isExhausted = error.message.includes('เครดิตหมดแล้ว') || errorCause?.includes('เครดิตหมดแล้ว');
        const isExpiredError = error.message.includes('เครดิตหมดอายุแล้ว') || errorCause?.includes('เครดิตหมดอายุแล้ว');

        if (isExhausted || isExpiredError) {
          setCreditLimitMessage(errorCause || error.message);
          setIsCreditExhausted(true);
          if (isExpiredError) {
             setIsExpired(true);
          }
          setShowCreditLimitModal(true);
          
          // Force refresh of credit button
          if (typeof window !== 'undefined') {
             window.dispatchEvent(new Event('credit-updated'));
          }
          return;
        }

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
    messages.length >= 2 ? `/api-i/vote?chatId=${id}` : null,
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
    const lastAssistant = messages.filter((m: ChatMessage) => m.role === 'assistant').pop();
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

    return messages.map((msg: ChatMessage, index: number) => {
      if (msg.role !== 'assistant') return msg;

      // Check if we have stored metadata for this message ID
      const storedMeta = messageMetadata[msg.id];
      if (storedMeta) {
        return {
          ...msg,
          usage: storedMeta.usage || msg.usage,
          model: storedMeta.model || msg.model,
          createdAt: storedMeta.createdAt || msg.createdAt,
        } as ChatMessage;
      }

      // For the last assistant message, apply 'pending' metadata if available
      const isLastAssistant = index === messages.length - 1 ||
        !messages.slice(index + 1).some((m: ChatMessage) => m.role === 'assistant');
      if (isLastAssistant && hasPending) {
        return {
          ...msg,
          usage: messageMetadata.pending!.usage || msg.usage,
          model: messageMetadata.pending!.model || msg.model,
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
              sendMessage={async (message: any, options: any) => {
                // Check credit/expiration before sending
                try {
                  const result = await getUsageStatsAction();
                  if (result.success && result.data) {
                    const remainingPercent = 100 - (result.data.tokens.percentage_used || 0);
                    const limitExpired = result.data.status.limit_expired || false;
                    
                    if (limitExpired) {
                      setIsExpired(true);
                      setIsCreditExhausted(true);
                      setShowCreditLimitModal(true);
                      return; // Stop sending
                    } else if (remainingPercent <= 0) {
                      setIsCreditExhausted(true);
                      setShowCreditLimitModal(true);
                      return; // Stop sending
                    }
                  }
                } catch (error) {
                  console.error('Failed to check credit before sending:', error);
                  // Optionally allow sending if check fails, or block it. 
                  // For now, let's allow it but log the error, 
                  // effectively failing open if the check service is down, 
                  // OR we could fail closed. 
                  // Given the requirement, let's try to proceed 
                  // as the backend likely has its own check too.
                }

                return sendMessage(message, options);
              }}
              selectedVisibilityType={visibilityType}
              isCreditExhausted={isCreditExhausted}
              isExpired={isExpired}
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

      {/* Credit Limit Modal */}
      <AlertDialog open={showCreditLimitModal} onOpenChange={setShowCreditLimitModal}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] rounded-xl md:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">
              {isExpired ? '⏰ หมดเวลาการใช้งาน' : '⚠️ เครดิตของคุณไม่เพียงพอ'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {isExpired ? (
                <>
                  <span className="block mb-2">บัญชีของคุณหมดอายุการใช้งานแล้ว คุณสามารถติดต่อผู้ดูแลระบบเพื่อขอเพิ่มโควต้าได้</span>
                  <span className="block text-xs text-gray-500">หมายเหตุ: วันหมดอายุถูกกำหนดโดยผู้ดูแลระบบ</span>
                </>
              ) : (
                <>
                  <span className="block mb-2">คุณได้ใช้เครดิต AI ครบตามโควต้ารายเดือนแล้ว ระบบจะรีเซ็ตโควต้าใหม่ในวันที่ 1 ของเดือนถัดไป หรือคุณสามารถติดต่อผู้ดูแลระบบเพื่อขอเพิ่มโควต้าได้</span>
                  <span className="block text-xs text-gray-500">หมายเหตุ: ในเวอร์ชัน Demo นี้ยังไม่มีระบบ Local AI สำรอง</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowCreditLimitModal(false);
              }}
            >
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
