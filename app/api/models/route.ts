import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session');

        if (!token?.value) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const response = await fetch(`${BACKEND_API_URL}/v1/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token.value}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch models' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching models:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
