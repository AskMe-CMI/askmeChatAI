import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { exchangeCodeForTokens, getUserInfo, parseOIDCError, type OIDCAuthState } from '@/lib/auth/oidc-provider';
import { debugOIDCEnvironment } from '@/lib/auth/oidc-config';

export async function POST(req: NextRequest) {
  try {
    const { code, state, session_state } = await req.json();

    // ตรวจสอบ error จาก OIDC provider
    // (ใน server-side, error จะถูก handle ก่อนถึงจุดนี้)

    if (!code || !state) {
      return NextResponse.json({ error: 'Invalid callback parameters' }, { status: 400 });
    }

    // สร้าง fallback state (ในกรณีที่ไม่มี sessionStorage)
    const storedState: OIDCAuthState = {
      state: state,
      nonce: 'fallback-nonce',
      redirectUri: process.env.OIDC_CALLBACK_URL || '',
    };

    // Debug env
    debugOIDCEnvironment();

    // แลกเปลี่ยน authorization code เป็น tokens
    const tokenData = await exchangeCodeForTokens(code, state, storedState);
    if (!tokenData) {
      return NextResponse.json({ error: 'Failed to exchange authorization code.' }, { status: 400 });
    }

    // ดึงข้อมูล user จาก access token
    const userInfo = await getUserInfo(tokenData.access_token);
    if (!userInfo) {
      return NextResponse.json({ error: 'Failed to retrieve user information.' }, { status: 400 });
    }

    // สร้าง email
    // const userEmail = userInfo.email || (session_state ? `oidc-${session_state.substring(0, 8)}@rmutl.ac.th` : `oidc-${Date.now()}@rmutl.ac.th`);

    // ส่งข้อมูลกลับไป client
    return NextResponse.json({
      user: {
        // email: userEmail,
        ...userInfo,
      },
      tokens: tokenData,
    });
  } catch (error) {
    console.error('OIDC callback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
