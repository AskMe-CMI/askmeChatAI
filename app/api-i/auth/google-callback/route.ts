import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { exchangeGoogleCode, getGoogleUserInfo } from '@/lib/auth/google-oidc-config';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Google ส่ง error กลับมา
        if (error) {
            const errorDescription = searchParams.get('error_description') || 'Unknown error';
            return NextResponse.redirect(
                new URL(`/login-google?error=${encodeURIComponent(errorDescription)}`, req.url)
            );
        }

        if (!code) {
            return NextResponse.redirect(
                new URL('/login-google?error=No authorization code received', req.url)
            );
        }

        // 1. แลก code เป็น tokens
        const tokenData = await exchangeGoogleCode(code);

        if (tokenData.error) {
            return NextResponse.redirect(
                new URL(`/login-google?error=${encodeURIComponent(JSON.stringify(tokenData))}`, req.url)
            );
        }

        // 2. ดึงข้อมูล user จาก Google
        const userInfo = await getGoogleUserInfo(tokenData.access_token);

        // 3. รวมข้อมูลทั้งหมดเก็บใน cookie เพื่อแสดงผล
        const responseData = {
            tokenData: {
                access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : null,
                id_token: tokenData.id_token ? `${tokenData.id_token.substring(0, 20)}...` : null,
                token_type: tokenData.token_type,
                expires_in: tokenData.expires_in,
                scope: tokenData.scope,
                refresh_token: tokenData.refresh_token ? '***exists***' : null,
            },
            userInfo: userInfo,
            raw_id_token_claims: tokenData.id_token ? decodeJwtPayload(tokenData.id_token) : null,
        };

        // เก็บข้อมูลใน cookie (encode เป็น base64)
        const encodedData = Buffer.from(JSON.stringify(responseData)).toString('base64');

        const response = NextResponse.redirect(new URL('/login-google?success=true', req.url));
        response.cookies.set('google_auth_data', encodedData, {
            httpOnly: false, // ให้ client อ่านได้เพื่อแสดงผล
            secure: false,
            path: '/',
            maxAge: 300, // 5 minutes - แค่ test
        });

        return response;
    } catch (error) {
        console.error('Google callback error:', error);
        return NextResponse.redirect(
            new URL(`/login-google?error=${encodeURIComponent(String(error))}`, req.url)
        );
    }
}

function decodeJwtPayload(jwt: string): any {
    try {
        const parts = jwt.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        const decoded = JSON.parse(
            Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
        );
        return decoded;
    } catch {
        return null;
    }
}
