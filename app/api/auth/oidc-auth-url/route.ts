import { NextResponse } from 'next/server';
import { createAuthorizationUrl } from '@/lib/auth/oidc-provider';

export async function GET() {
  // สร้าง authorization URL และ state ด้วยฟังก์ชันฝั่ง server
  const { url, state } = createAuthorizationUrl();
  return NextResponse.json({ url, state });
}
