import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.BACKEND_API_URL;
import { backendApi } from '@/lib/config/api-client';

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

        // Use backendApi which has built-in logging
        const response = await backendApi.get('/v1/models', {
            token: token.value,
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.success) {
            console.error('Models API connection error:', {
                status: response.status,
                message: response.message,
                error: response.error
            });
            return NextResponse.json(
                { error: `Failed to fetch models: ${response.status}`, details: response.message },
                { status: response.status || 500 }
            );
        }

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching models:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
