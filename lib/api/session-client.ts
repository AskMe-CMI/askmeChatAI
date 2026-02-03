/**
 * Session API Client
 * Handles chat session management with the backend API
 */

import { getStoredToken } from '@/lib/auth/local-auth';

const BACKEND_API_URL = process.env.BACKEND_API_URL;

// Types
export interface Session {
    id: string;
    title: string;
    model?: string;
    created_at: string;
    updated_at: string;
}

export interface SessionMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    attachments?: Attachment[];
    created_at: string;
}

export interface Attachment {
    type: 'image' | 'file';
    url: string;
    filename?: string;
    content_type?: string;
}

export interface SessionDetail extends Session {
    messages: SessionMessage[];
}

export interface CreateSessionRequest {
    title: string;
    model?: string;
}

export interface SendMessageRequest {
    content: string;
    model?: string;
    attachments?: Attachment[];
}

export interface SendMessageResponse {
    user_message: SessionMessage;
    assistant_message: SessionMessage;
}

/**
 * Create a new chat session
 */
export async function createSession(
    request: CreateSessionRequest
): Promise<Session | null> {
    if (!BACKEND_API_URL) {
        console.error('BACKEND_API_URL is not configured');
        return null;
    }

    const token = await getStoredToken();
    if (!token) {
        console.error('No auth token available');
        return null;
    }

    try {
        const response = await fetch(`${BACKEND_API_URL}/api/chat-history/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            console.error('Failed to create session:', response.status);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating session:', error);
        return null;
    }
}

/**
 * Get session details including messages
 */
export async function getSession(sessionId: string): Promise<SessionDetail | null> {
    if (!BACKEND_API_URL) {
        console.error('BACKEND_API_URL is not configured');
        return null;
    }

    const token = await getStoredToken();
    if (!token) {
        console.error('No auth token available');
        return null;
    }

    try {
        const response = await fetch(
            `${BACKEND_API_URL}/api/chat-history/sessions/${sessionId}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            console.error('Failed to get session:', response.status);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

/**
 * Send a message to a session (text and/or attachments)
 */
export async function sendMessage(
    sessionId: string,
    request: SendMessageRequest
): Promise<SendMessageResponse | null> {
    if (!BACKEND_API_URL) {
        console.error('BACKEND_API_URL is not configured');
        return null;
    }

    const token = await getStoredToken();
    if (!token) {
        console.error('No auth token available');
        return null;
    }

    try {
        const response = await fetch(
            `${BACKEND_API_URL}/api/chat-history/sessions/${sessionId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            console.error('Failed to send message:', response.status);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
    if (!BACKEND_API_URL) {
        console.error('BACKEND_API_URL is not configured');
        return false;
    }

    const token = await getStoredToken();
    if (!token) {
        console.error('No auth token available');
        return false;
    }

    try {
        const response = await fetch(
            `${BACKEND_API_URL}/api/chat-history/sessions/${sessionId}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.ok;
    } catch (error) {
        console.error('Error deleting session:', error);
        return false;
    }
}
