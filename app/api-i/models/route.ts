import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { backendApi } from '@/lib/config/api-client';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session');

        // Debug: Log environment and configuration
        console.log('=== Models API Debug ===');
        console.log('BACKEND_API_URL:', process.env.BACKEND_API_URL);
        console.log('Token exists:', !!token?.value);

        if (!token?.value) {
            console.log('No token found, returning 401');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Log the full URL that will be called
        const fullUrl = `${process.env.BACKEND_API_URL}/v1/models`;
        console.log('Calling Backend URL:', fullUrl);

        // Use backendApi which has built-in logging
        const response = await backendApi.get('/v1/models', {
            token: token.value,
            headers: {
                'Accept': 'application/json',
            }
        });

        // Debug: Log the response
        console.log('Backend Response:', {
            success: response.success,
            status: response.status,
            url: response.url,
            data: response.data,
            error: response.error
        });
        console.log('=== End Models API Debug ===');

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

        return NextResponse.json({
            ...(typeof response.data === 'object' ? response.data : { data: response.data }),
            url: response.url
        });
    } catch (error) {
        console.error('Error fetching models:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
