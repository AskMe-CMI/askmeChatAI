import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/auth/oidc-provider';

export async function POST(req: NextRequest) {
  const { code, state } = await req.json();

  // สร้าง storedState แบบ fallback (หรือ reconstruct ตาม logic ของคุณ)
  const storedState = {
    state: state || '',
    nonce: 'fallback-nonce',
    redirectUri: process.env.NEXT_PUBLIC_OIDC_CALLBACK_URL || 'https://chat.rmutl.ac.th/oidc/callback'
  };

  const tokens = await exchangeCodeForTokens(code, state, storedState);
  if (!tokens) {
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 400 });
  }
  return NextResponse.json(tokens);
}