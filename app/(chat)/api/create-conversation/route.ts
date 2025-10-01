import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import type { NextRequest } from 'next/server';

// NOTE: This endpoint is not actively used
// New conversations are created via /api/chat endpoint
// This file exists to satisfy Next.js type system requirements

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Redirect to main chat endpoint
  return Response.json(
    {
      success: false,
      error: 'This endpoint is deprecated. Use /api/chat instead.',
      redirect: '/api/chat',
    },
    { status: 410 },
  ); // 410 Gone
}
