import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getChatById } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

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
    const chat = await getChatById({ id });

    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    if (chat.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat').toResponse();
    }

    // Return chat with conversation mapping
    return Response.json({
      success: true,
      data: {
        chatId: chat.id,
        conversationId: chat.conversationId,
        messageId: chat.messageId,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting chat conversation info:', error);
    return new ChatSDKError('offline:chat').toResponse();
  }
}
