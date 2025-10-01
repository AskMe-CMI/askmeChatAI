'use server';

import type { UIMessage } from 'ai';
import { cookies } from 'next/headers';
import type { VisibilityType } from '@/components/visibility-selector';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  // Extract text content from message parts
  let messageText = '';
  if (message.parts && Array.isArray(message.parts)) {
    const textPart = message.parts.find((part: any) => part.type === 'text');
    messageText = textPart?.text || '';
  }

  // Fallback to a simple title based on message content
  if (!messageText) {
    return 'New Chat';
  }

  // For now, create a simple title from the first 50 characters
  // Later we can enable Dify title generation when the integration is stable
  const simpleTitle = messageText.length > 50 
    ? `${messageText.substring(0, 50)}...`
    : messageText;

  return simpleTitle;

  // TODO: Enable Dify title generation when ready
  // try {
  //   const { text: title } = await generateText({
  //     model: myProvider.languageModel('title-model'),
  //     system: `\n
  //     - you will generate a short title based on the first message a user begins a conversation with
  //     - ensure it is not more than 80 characters long
  //     - the title should be a summary of the user's message
  //     - do not use quotes or colons`,
  //     prompt: messageText,
  //   });
  //   return title;
  // } catch (error) {
  //   console.error('Error generating title:', error);
  //   return simpleTitle;
  // }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  // Since we don't use database anymore, this function does nothing
  // In a real implementation, you might want to store messages in localStorage or other storage
  console.log('deleteTrailingMessages called with id:', id);
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  // Since we don't use database anymore, this function does nothing
  // In a real implementation, you might want to store chat visibility in localStorage or other storage
  console.log('updateChatVisibility called with chatId:', chatId, 'visibility:', visibility);
}
