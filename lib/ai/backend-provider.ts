// Declare Node.js globals
declare const process: any;

import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.BACKEND_API_URL;
const COOKIE_NAME = 'session';

/**
 * Get the stored JWT token from cookies
 */
async function getStoredToken(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME);
        return token?.value || null;
    } catch (error) {
        console.error('Error getting stored token:', error);
        return null;
    }
}

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface BackendChatRequest {
    model: string;
    messages: ChatMessage[];
    stream?: boolean;
}

interface BackendChatChoice {
    index: number;
    message: {
        role: string;
        content: string;
    };
    finish_reason: string;
}

interface BackendChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: BackendChatChoice[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * Send a chat completion request to the backend API
 * Returns a streaming response
 */
export async function sendChatCompletion(
    model: string,
    messages: ChatMessage[],
    stream: boolean = true
): Promise<Response> {
    const token = await getStoredToken();

    if (!token) {
        console.error('❌ No JWT token available for chat API');
        throw new Error('Authentication required');
    }

    const requestBody: BackendChatRequest = {
        model,
        messages,
        stream,
    };

    console.log('🌐 Backend Chat API Request:', {
        url: `${BACKEND_API_URL}/v1/chat/completions`,
        model,
        messageCount: messages.length,
        stream,
    });

    const response = await fetch(`${BACKEND_API_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': stream ? 'text/event-stream' : 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    console.log('📡 Backend Chat API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
    });

    // Handle spend limit exceeded
    if (response.status === 402 || response.status === 429) {
        console.error('❌ Spend limit exceeded or rate limited');
        throw new Error('Spend limit exceeded. Please contact administrator.');
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend Chat API Error:', {
            status: response.status,
            error: errorText,
        });
        throw new Error(`Chat API error: ${response.status} - ${errorText}`);
    }

    return response;
}

export function convertToChatMessages(uiMessages: any[]): ChatMessage[] {
    return uiMessages.map((msg) => {
        // Extract text content from parts if present
        let content = '';
        if (msg.parts && Array.isArray(msg.parts)) {
            content = msg.parts
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text)
                .join('');
        } else if (msg.content) {
            content = msg.content;
        }

        return {
            role: msg.role as 'user' | 'assistant' | 'system',
            content,
        };
    });
}

interface BackendSession {
    id: number;
    title: string;
    model: string;
    created_at: string;
    updated_at: string;
}

/**
 * Create a new chat session on Backend API
 */
export async function createBackendSession(title: string, model: string): Promise<BackendSession | null> {
    const token = await getStoredToken();

    if (!token) {
        console.error('❌ No JWT token available for session creation');
        return null;
    }

    console.log('📝 Creating Backend session:', { title, model });

    try {
        const response = await fetch(`${BACKEND_API_URL}/chat-history/sessions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, model }),
        });

        console.log('📡 Backend Session Create Response:', {
            status: response.status,
            ok: response.ok,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to create backend session:', errorText);
            return null;
        }

        const session: BackendSession = await response.json();
        console.log('✅ Backend session created:', { id: session.id, title: session.title });
        return session;
    } catch (error) {
        console.error('❌ Error creating backend session:', error);
        return null;
    }
}

/**
 * Add a message to a Backend session
 */
export async function addMessageToSession(
    sessionId: number,
    role: 'user' | 'assistant',
    content: string,
    model?: string
): Promise<boolean> {
    const token = await getStoredToken();

    if (!token) {
        console.error('❌ No JWT token available for adding message');
        return false;
    }

    try {
        const body: any = { role, content };
        if (model) body.model = model;

        const response = await fetch(`${BACKEND_API_URL}/chat-history/sessions/${sessionId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to add message to session:', errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Error adding message to session:', error);
        return false;
    }
}

/**
 * Response from sending a message to a session
 */
interface SessionMessageResponse {
    session_id: number;
    user_message: {
        id: number;
        role: string;
        content: string;
        created_at: string;
    };
    ai_message: {
        id: number;
        role: string;
        content: string;
        model: string;
        tokens: number;
        created_at: string;
    };
    usage?: {
        completion_tokens: number;
        prompt_tokens: number;
        total_tokens: number;
    };
}

/**
 * Attachment for multimodal messages
 */
export interface Attachment {
    type: 'image' | 'file' | 'document';
    url: string;
}

/**
 * Send a message to a Backend session and get AI response
 * This endpoint handles everything: sends to AI, saves user message, saves AI response
 * 
 * @param sessionId - The Backend session ID
 * @param content - The user's message content
 * @param model - Optional model to use (defaults to session's model)
 * @param attachments - Optional array of file attachments (images, documents, etc.)
 * @returns The response containing both user and AI messages, or null on error
 */
export async function sendMessageToSession(
    sessionId: number,
    content: string,
    model?: string,
    attachments?: Attachment[]
): Promise<SessionMessageResponse | null> {
    const token = await getStoredToken();

    if (!token) {
        console.error('❌ No JWT token available for sending message');
        return null;
    }

    console.log('📤 Sending message to Backend session:', {
        sessionId,
        contentLength: content.length,
        model: model || '(session default)',
        attachmentsCount: attachments?.length || 0,
    });

    try {
        const body: any = { content };
        if (model) body.model = model;
        if (attachments && attachments.length > 0) {
            body.attachments = attachments;
        }

        const response = await fetch(`${BACKEND_API_URL}/chat-history/sessions/${sessionId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to send message to session:', errorText);
            return null;
        }

        const data: SessionMessageResponse = await response.json();

        console.log('✅ Message sent to Backend session:', {
            sessionId: data.session_id,
            userMessageId: data.user_message.id,
            aiMessageId: data.ai_message.id,
            aiContentLength: data.ai_message.content.length,
        });

        return data;
    } catch (error) {
        console.error('❌ Error sending message to session:', error);
        return null;
    }
}
