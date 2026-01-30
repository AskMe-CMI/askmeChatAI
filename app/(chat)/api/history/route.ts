import type { NextRequest } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import { getStoredToken } from '@/lib/auth/local-auth';

// Declare Node.js globals
declare const process: any;

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://192.168.9.14:8000';

// Backend session response type
interface BackendSession {
  id: number;
  title: string;
  model: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

// Transform backend session to our Chat format
function transformBackendToChat(session: BackendSession, userId: string) {
  return {
    id: String(session.id), // Convert number to string
    title: session.title || 'Untitled Chat',
    userId: userId,
    visibility: 'private' as const,
    model: session.model,
    messageCount: session.message_count,
    lastMessageAt: session.last_message_at ? new Date(session.last_message_at) : null,
    createdAt: new Date(session.created_at),
    updatedAt: new Date(session.updated_at),
  };
}


export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '20');
  const offset = Number.parseInt(searchParams.get('offset') || '0');

  // Get token from session cookie
  const token = await getStoredToken();

  if (!token) {
    console.log('History API - No token found, returning 401');
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    // Build Backend API URL
    const backendUrl = new URL(
      '/api/chat-history/sessions',
      BACKEND_API_URL,
    );
    // Request more items to handle offset-based pagination
    const backendLimit = limit + offset;
    backendUrl.searchParams.set('limit', backendLimit.toString());

    console.log('History API - Calling Backend URL:', backendUrl.toString());

    // Call Backend API
    const response = await fetch(backendUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return new ChatSDKError('unauthorized:chat').toResponse();
      }
      throw new Error(
        `Backend API error: ${response.status} ${response.statusText}`,
      );
    }

    const backendData: BackendSession[] = await response.json();
    console.log('History API - Backend response:', {
      totalItems: backendData.length,
    });

    // Transform backend data to our chat format
    // Use a placeholder userId since backend handles user filtering
    const allChats = backendData.map((session) =>
      transformBackendToChat(session, 'backend-user'),
    );

    // Apply offset and limit for pagination
    const paginatedChats = allChats.slice(offset, offset + limit);
    const hasMore = offset + limit < allChats.length;

    console.log('History API - Pagination result:', {
      offset,
      limit,
      totalChats: allChats.length,
      returnedChats: paginatedChats.length,
      hasMore,
    });

    return Response.json({
      chats: paginatedChats,
      hasMore,
    });
  } catch (error) {
    console.error('❌ Backend API error:', error);

    // Return empty data on error
    return Response.json({
      chats: [],
      hasMore: false,
      _error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
