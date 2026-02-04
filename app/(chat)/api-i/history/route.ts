import type { NextRequest } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import { getStoredToken } from '@/lib/auth/local-auth';

// Declare Node.js globals
declare const process: any;

const BACKEND_API_URL = process.env.BACKEND_API_URL;
import { backendApi } from '@/lib/config/api-client';

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
    // Use backendApi instead of raw fetch
    // Note: backendApi handles BACKEND_API_URL prefix automatically
    const backendData = await backendApi.get<BackendSession[]>('/chat-history/sessions', {
      token,
      headers: {
        'Accept': 'application/json',
      }
    });

    // Check for success using ApiClient's standardized response
    if (!backendData.success) {
      if (backendData.status === 401) {
        return new ChatSDKError('unauthorized:chat').toResponse();
      }

      console.error('History API - Backend error response:', {
        status: backendData.status,
        url: '/chat-history/sessions',
        error: backendData.error || backendData.message
      });

      throw new Error(
        `Backend API error: ${backendData.status} ${backendData.message || 'Unknown error'}`,
      );
    }

    // With ApiClient, data is in backendData.data
    // Note: The original code expected an array directly. ApiClient wraps it in .data
    // If the API returns an array directly, ApiClient puts it in .data
    const sessions = backendData.data || [];

    console.log('History API - Backend response:', {
      totalItems: sessions.length,
    });

    // Transform backend data to our chat format
    // Use a placeholder userId since backend handles user filtering
    const allChats = sessions.map((session) =>
      transformBackendToChat(session, 'backend-user'),
    );

    // Apply offset and limit for pagination client-side (as per original logic)
    // Note: Ideally pagination should happen on backend, but preserving original logic for now
    // Original logic: requested limit + offset, then sliced locally.
    // If backend supports true pagination parameters, we should pass them.
    // Current backendApi call doesn't pass query params easily without constructing URL.
    // Let's rely on simple slice for now to match exactly what was replaced.

    // Wait, the original code DID pass ?limit=... to backend.
    // Let's implement that properly.

    // We need to re-fetch with query params. ApiClient.get takes endpoint string.
    // We can append query params to the endpoint string.
    const queryParams = new URLSearchParams();
    const backendLimit = limit + offset;
    queryParams.set('limit', backendLimit.toString());

    // Re-doing the call with query params
    const responseWithParams = await backendApi.get<BackendSession[]>(`/chat-history/sessions?${queryParams.toString()}`, {
      token,
      headers: { 'Accept': 'application/json' }
    });

    if (!responseWithParams.success) {
      if (responseWithParams.status === 401) return new ChatSDKError('unauthorized:chat').toResponse();
      throw new Error(`Backend API error: ${responseWithParams.status}`);
    }

    const fetchedSessions = responseWithParams.data || [];

    const transformedChats = fetchedSessions.map((session) =>
      transformBackendToChat(session, 'backend-user'),
    );

    const paginatedChats = transformedChats.slice(offset, offset + limit);
    const hasMore = offset + limit < transformedChats.length;

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
