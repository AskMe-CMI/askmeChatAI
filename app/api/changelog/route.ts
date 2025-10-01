import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function GET() {
	try {
		const filePath = path.join(process.cwd(), 'CHANGELOG.md');
		const content = await fs.readFile(filePath, 'utf-8');
		return new NextResponse(content, {
			status: 200,
			headers: { 'Content-Type': 'text/plain; charset=utf-8' },
		});
	} catch (error) {
		return new NextResponse('Changelog not found', { status: 404 });
	}
}
