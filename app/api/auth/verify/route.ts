import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET() {
	try {
			const session = await auth();

			if (!session) {
				return NextResponse.json({ ok: false }, { status: 401 });
			}

			return NextResponse.json({ ok: true, user: session.user }, { status: 200 });
	} catch (error: any) {
		return NextResponse.json({ ok: false, error: error?.message || 'verify_failed' }, { status: 500 });
	}
}
