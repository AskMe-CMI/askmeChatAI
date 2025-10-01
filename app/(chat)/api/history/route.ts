import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { ChatSDKError } from '@/lib/errors';

// Declare Node.js globals
declare const process: any;

// Dify conversation response type
interface DifyConversation {
  id: string;
  name: string;
  inputs: Record<string, any>;
  status: string;
  introduction: string;
  created_at: number;
  updated_at: number;
}

interface DifyConversationsResponse {
  limit: number;
  has_more: boolean;
  data: DifyConversation[];
}

// Transform Dify conversation to our Chat format
function transformDifyToChat(conversation: DifyConversation, userId: string) {
  return {
    id: conversation.id,
    title: conversation.name || 'Untitled Chat',
    userId: userId,
    visibility: 'private' as const, // Dify conversations are private by default
    createdAt: new Date(conversation.created_at * 1000), // Convert unix timestamp to Date
    updatedAt: new Date(conversation.updated_at * 1000),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '20');
  const offset = Number.parseInt(searchParams.get('offset') || '0');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  // Support both offset and cursor-based pagination
  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    console.log('History API - No session, returning 401');
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    // Get user email from session (assuming it's available)
    const userEmail = session.user.email || session.user.id;
    console.log('History API - User email:', userEmail);

    // Build Dify API URL
    const difyApiUrl = new URL(
      '/v1/conversations',
      process.env.DIFY_BASE_URL || 'https://dify.askme.co.th',
    );
    difyApiUrl.searchParams.set('user', userEmail);

    // Use a larger limit for Dify API call and handle pagination manually
    // if Dify doesn't support offset-based pagination
    const difyLimit = Math.max(limit + offset, 100); // Get more data to handle offset
    difyApiUrl.searchParams.set('limit', difyLimit.toString());

    // console.log('History API - Calling Dify URL:', difyApiUrl.toString());
    // console.log('History API - Pagination params:', {
    //   limit,
    //   offset,
    //   startingAfter,
    //   endingBefore,
    // });

    // Add cursor-based pagination parameters if provided (fallback)
    if (startingAfter) {
      difyApiUrl.searchParams.set('starting_after', startingAfter);
    }
    if (endingBefore) {
      difyApiUrl.searchParams.set('ending_before', endingBefore);
    }

    // Call Dify API
    // console.log('History API - Making request to Dify...');
    const response = await fetch(difyApiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Dify API error: ${response.status} ${response.statusText}`,
      );
    }

    const difyData: DifyConversationsResponse = await response.json();
    // console.log('History API - Dify response:', {
    //   totalItems: difyData.data.length,
    //   hasMore: difyData.has_more,
    // });

    // Transform Dify data to our chat format
    const allChats = difyData.data.map((conversation) =>
      transformDifyToChat(conversation, userEmail),
    );

    // Apply offset and limit for manual pagination
    const paginatedChats = allChats.slice(offset, offset + limit);
    const hasMore = offset + limit < allChats.length || difyData.has_more;

    // console.log('History API - Pagination result:', {
    //   offset,
    //   limit,
    //   totalChats: allChats.length,
    //   returnedChats: paginatedChats.length,
    //   hasMore,
    // });

    return Response.json({
      chats: paginatedChats,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching conversations from Dify:', error);
    return new ChatSDKError(
      'bad_request:api',
      'Failed to fetch chat history from Dify API',
    ).toResponse();
  }
}
