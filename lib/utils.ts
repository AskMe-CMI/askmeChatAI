// Avoid importing some 'ai' internal types that may not exist in the installed version.
// Use the project's ChatMessage/UIMessagePart types instead.
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DBMessage, Document } from '@/lib/db/schema';
import type { ChatMessage, } from './types';
import { ChatSDKError, type ErrorCode } from './errors';
import { formatISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessage = { id: string } & Partial<import('@/lib/types').ChatMessage>;

export function getMostRecentUserMessage(messages: ChatMessage[]) {
  const userMessages = messages.filter((message) => (message as any).role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getTrailingMessageId({ messages }: { messages: Array<ResponseMessage> }): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  // Remove <think> tags and their content
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove has_function_call marker
  cleaned = cleaned.replace('<has_function_call>', '');
  // Trim any extra whitespace
  return cleaned.trim();
}

// Accept either the richer DBMessage shape or the legacy Message shape
export function convertToUIMessages(
  messages: Array<DBMessage | { id: string; role: 'user' | 'assistant' | 'system'; parts?: any[]; createdAt: Date }>,
): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
  parts: (message as any).parts as any[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

export function getTextFromMessage(message: ChatMessage): string {
  return ((message.parts ?? []) as any[])
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('');
}
