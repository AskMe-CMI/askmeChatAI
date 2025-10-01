import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID || null,
    OIDC_TENANT_ID: process.env.OIDC_TENANT_ID || null,
    OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET ? '***' : null, // Hide secret value
    OIDC_CALLBACK_URL: process.env.OIDC_CALLBACK_URL || null,
  });
}
