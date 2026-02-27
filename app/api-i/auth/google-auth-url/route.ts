import { NextResponse } from 'next/server';
import { createGoogleAuthUrl } from '@/lib/auth/google-oidc-config';

export async function GET() {
    const { url, state } = createGoogleAuthUrl();
    return NextResponse.json({ url, state });
}
