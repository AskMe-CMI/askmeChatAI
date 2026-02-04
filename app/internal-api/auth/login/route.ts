import { NextResponse } from 'next/server';
import { signIn } from '@/app/(auth)/auth';

export async function POST(request: Request) {
		try {
			const { email, password } = await request.json();

				// signIn will create a token server-side; call it to get token value
				const token = await signIn(email, password);

				// Create response and explicitly set session cookie so clients receive it
				const response = NextResponse.json(
					{
						success: true,
						user: {
							id: '12345',
							email,
							name: 'Demo User',
						},
					},
					{ status: 200 },
				);

				response.cookies.set('session', token, {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax',
					maxAge: 60 * 60 * 24 * 7,
					path: '/',
				});

				return response;
		} catch (error: any) {
			return NextResponse.json({ success: false, error: error?.message || 'login_failed' }, { status: 400 });
		}
}
