import { NextResponse } from 'next/server';
import { signOut } from '@/app/(auth)/auth';

export async function POST() {
	try {
		await signOut();
		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (error: any) {
		return NextResponse.json({ ok: false, error: error?.message || 'logout_failed' }, { status: 500 });
	}
}
