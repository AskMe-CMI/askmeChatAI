'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  type DragEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { VisibilityType } from './visibility-selector';
import type { Attachment, ChatMessage } from '@/lib/types';
import { SuggestedActions } from './suggested-actions';
import { uploadFileAction } from '@/app/(chat)/actions/upload';

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (larger for documents)
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.txt', '.pdf', '.doc', '.docx'];

// Extended attachment type that includes pending file for upload
export interface PendingAttachment extends Attachment {
  file?: File; // File object for pending uploads
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  isCreditExhausted,
  isExpired,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  className?: string;
  selectedVisibilityType: VisibilityType;
  isCreditExhausted?: boolean;
  isExpired?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  // Shared file validation logic
  const validateFiles = useCallback((files: File[]): PendingAttachment[] => {
    const validFiles: PendingAttachment[] = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        const ext = file.name.toLowerCase().split('.').pop();
        if (!ext || !ALLOWED_EXTENSIONS.includes(`.${ext}`)) {
          toast.error(`ไฟล์ ${file.name} ไม่รองรับ กรุณาเลือกไฟล์ประเภท: ${ALLOWED_EXTENSIONS.join(', ')}`);
          continue;
        }
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`ไฟล์ ${file.name} มีขนาดเกิน 5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า`);
        continue;
      }

      // Create local preview URL
      const localUrl = URL.createObjectURL(file);
      validFiles.push({
        url: localUrl,
        name: file.name,
        contentType: file.type,
        file: file,
      });
    }

    return validFiles;
  }, []);

  const submitForm = useCallback(async () => {
    console.log('🚀 submitForm called with:', {
      chatId,
      input,
      inputLength: input.length,
      attachmentsCount: attachments.length,
    });

    // Upload pending files before sending
    const pendingAttachments = attachments as PendingAttachment[];
    const uploadedAttachments: Attachment[] = [];

    if (pendingAttachments.some(a => a.file)) {
      setIsUploading(true);
      try {
        for (const attachment of pendingAttachments) {
          if (attachment.file) {
            // Upload the file
            const result = await uploadFile(attachment.file);
            if (result) {
              uploadedAttachments.push(result);
            } else {
              toast.error(`Failed to upload ${attachment.name}`);
              setIsUploading(false);
              return; // Stop if any upload fails
            }
          } else {
            // Already uploaded (has URL)
            uploadedAttachments.push(attachment);
          }
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        toast.error('Failed to upload files');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    } else {
      uploadedAttachments.push(...attachments);
    }

    console.log('📤 Calling sendMessage with:', {
      role: 'user',
      partsCount: uploadedAttachments.length + 1,
      textLength: input.length,
    });

    const result = sendMessage({
      role: 'user',
      createdAt: new Date().toISOString(),
      parts: [
        ...uploadedAttachments.map((attachment) => ({
          type: 'file' as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        })),
        {
          type: 'text',
          text: input,
        },
      ],
    });

    console.log('✅ sendMessage result:', result);

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();
    setInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use server action to upload to backend API
      const result = await uploadFileAction(formData);

      if (result.success && result.file) {
        return {
          url: result.file.url,
          name: result.file.filename,
          contentType: result.file.content_type,
        };
      }

      toast.error(result.error || 'Upload failed');
      return undefined;
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
      return undefined;
    }
  };

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validFiles = validateFiles(files);

      if (validFiles.length > 0) {
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...validFiles,
        ]);
      }

      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    },
    [setAttachments, validateFiles],
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current += 1;
    if (event.dataTransfer?.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = Array.from(event.dataTransfer?.files || []);
      if (files.length === 0) return;

      const validFiles = validateFiles(files);

      if (validFiles.length > 0) {
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...validFiles,
        ]);
      }
    },
    [setAttachments, validateFiles],
  );

  // Paste file handler (Ctrl+V with copied files)
  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length === 0) return;

      // Prevent default paste behavior for files
      event.preventDefault();

      const validFiles = validateFiles(files);

      if (validFiles.length > 0) {
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...validFiles,
        ]);
      }
    },
    [setAttachments, validateFiles],
  );

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  return (
    <div className="relative w-full flex flex-col gap-4">
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute left-1/2 bottom-28 -translate-x-1/2 z-10"
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <ArrowDown />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            sendMessage={sendMessage}
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            disabled={isCreditExhausted || isExpired}
          />
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,text/plain,.txt,application/pdf,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,.docx"
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <div
        className={cx('relative', isDragging && 'ring-2 ring-primary/50 rounded-2xl')}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop zone overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-primary/5 dark:bg-primary/10 border-2 border-dashed border-primary/40 pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-primary">
              <PaperclipIcon size={24} />
              <span className="text-sm font-medium">วางไฟล์ที่นี่</span>
              <span className="text-xs text-muted-foreground">รองรับ: รูปภาพ, PDF, Word, Text</span>
            </div>
          </div>
        )}

        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            data-testid="attachments-preview"
            className="flex flex-row gap-2 overflow-x-scroll items-end"
          >
            {attachments.map((attachment) => (
              <PreviewAttachment
                key={attachment.url}
                attachment={attachment}
                onRemove={() => {
                  setAttachments((currentAttachments) =>
                    currentAttachments.filter((a) => a.url !== attachment.url),
                  );
                  toast.success('ลบรูปภาพเรียบร้อยแล้ว');
                }}
              />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                key={filename}
                attachment={{
                  url: '',
                  name: filename,
                  contentType: '',
                }}
                isUploading={true}
              />
            ))}
          </div>
        )}

        <Textarea
          data-testid="multimodal-input"
          ref={textareaRef}
          placeholder={isExpired ? "บัญชีของคุณหมดอายุแล้ว กรุณาติดต่อผู้ดูแลระบบ" : (isCreditExhausted ? "เครดิตหมดแล้ว กรุณาติดต่อผู้ดูแลระบบ" : "Send a message...")}
          value={input}
          onChange={handleInput}
          className={cx(
            'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-sidebar pb-10 dark:border-zinc-700 shadow-lg',
            isCreditExhausted && 'opacity-60 cursor-not-allowed',
            className,
          )}
          rows={2}
          autoFocus
          disabled={isCreditExhausted}
          onKeyDown={(event) => {
            console.log(
              '🎯 Textarea keydown:',
              event.key,
              'shiftKey:',
              event.shiftKey,
              'composing:',
              event.nativeEvent.isComposing,
            );

            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              console.log(
                '✅ Enter pressed - preventing default and calling submitForm',
              );
              event.preventDefault();

              if (status !== 'ready') {
                toast.error('Please wait for the model to finish its response!');
              } else if (input.trim().length === 0) {
                toast.error('กรุณาพิมพ์ข้อความก่อนส่ง');
              } else {
                submitForm();
              }
            }
          }}
          onPaste={handlePaste}
        />

        <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
          <AttachmentsButton fileInputRef={fileInputRef} status={status} isCreditExhausted={isCreditExhausted} />
        </div>

        <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
          {status === 'submitted' ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton
              input={input}
              submitForm={submitForm}
              uploadQueue={uploadQueue}
              attachments={attachments}
              isUploading={isUploading}
              isCreditExhausted={isCreditExhausted}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    if (prevProps.isCreditExhausted !== nextProps.isCreditExhausted) return false;
    if (prevProps.isExpired !== nextProps.isExpired) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
  isCreditExhausted,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>['status'];
  isCreditExhausted?: boolean;
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="rounded-md p-1.5 h-fit text-muted-foreground hover:text-foreground transition-colors"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready' || isCreditExhausted}
      variant="ghost"
      size="sm"
    >
      <PaperclipIcon size={16} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600 text-white dark:bg-ring"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
  attachments,
  isUploading,
  isCreditExhausted,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
  attachments: Array<Attachment>;
  isUploading: boolean;
  isCreditExhausted?: boolean;
}) {
  return (
    <Button
      type="button"
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600 text-white dark:bg-ring"
      onClick={(event) => {
        console.log('🎯 Send button clicked');
        event.preventDefault();
        submitForm();
      }}
      disabled={input.trim().length === 0 || uploadQueue.length > 0 || isUploading || isCreditExhausted}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.attachments.length !== nextProps.attachments.length)
    return false;
  if (prevProps.isUploading !== nextProps.isUploading) return false;
  if (prevProps.isCreditExhausted !== nextProps.isCreditExhausted) return false;
  return true;
});

