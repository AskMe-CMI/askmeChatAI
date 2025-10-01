/**
 * Dify API Integration
 * Simple wrapper for Dify chat completion and conversation management
 */

// Dify API Types
export interface DifyChatRequest {
  inputs: Record<string, any>;
  query: string;
  user: string;
  response_mode: 'blocking' | 'streaming';
  conversation_id?: string;
  files?: Array<{
    type: string;
    transfer_method: string;
    url: string;
  }>;
}

export interface DifyChatResponse {
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: {
    usage: {
      prompt_tokens: number;
      prompt_price: string;
      completion_tokens: number;
      completion_price: string;
      total_tokens: number;
      total_price: string;
      currency: string;
      latency: number;
    };
    retriever_resources: any[];
  };
  created_at: number;
}

export interface DifyStreamResponse {
  event: string;
  message_id: string;
  conversation_id: string;
  answer?: string;
  created_at: number;
  metadata?: any;
}

// Configuration
const DIFY_CONFIG = {
  baseUrl: process.env.DIFY_BASE_URL || 'https://dify.askme.co.th',
  apiKey: process.env.DIFY_API_KEY,
};

// Dify API Client
export class DifyClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config = DIFY_CONFIG) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey || '';
  }

  // Send chat message (blocking mode)
  async chatCompletion(request: DifyChatRequest): Promise<DifyChatResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...request,
        response_mode: 'blocking',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  // Send chat message (streaming mode)
  async chatStream(request: DifyChatRequest): Promise<ReadableStream> {
    const response = await fetch(`${this.baseUrl}/v1/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...request,
        response_mode: 'streaming',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify API error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body received from Dify API');
    }

    return response.body;
  }

  // Get conversation history
  async getConversation(conversationId: string, user: string) {
    const url = new URL(`${this.baseUrl}/v1/conversations/${conversationId}`);
    url.searchParams.set('user', user);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.status}`);
    }

    return response.json();
  }

  // Get messages in conversation
  async getMessages(conversationId: string, user: string, limit = 100) {
    const url = new URL(`${this.baseUrl}/v1/messages`);
    url.searchParams.set('conversation_id', conversationId);
    url.searchParams.set('user', user);
    url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get messages: ${response.status}`);
    }

    return response.json();
  }

  // Get conversations list
  async getConversations(user: string, limit = 20) {
    const url = new URL(`${this.baseUrl}/v1/conversations`);
    url.searchParams.set('user', user);
    url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get conversations: ${response.status}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const difyClient = new DifyClient();

// Helper functions for message transformation
export function createDifyChatRequest(
  query: string,
  user: string,
  conversationId?: string,
  files?: any[],
): DifyChatRequest {
  return {
    inputs: {},
    query,
    user,
    response_mode: 'streaming',
    conversation_id: conversationId,
    files,
  };
}

// Parse SSE stream from Dify
export function parseDifyStream(chunk: string): DifyStreamResponse[] {
  const lines = chunk.split('\n').filter((line) => line.trim());
  const events: DifyStreamResponse[] = [];

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        events.push(data);
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }

  return events;
}
