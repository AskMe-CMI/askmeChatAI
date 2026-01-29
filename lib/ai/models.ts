export const DEFAULT_CHAT_MODEL: string = 'gpt-4.1-mini';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

// Fallback models if backend is unavailable
export const fallbackChatModels: Array<ChatModel> = [
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: 'Fast and efficient model',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'Advanced reasoning model',
  },
];

// Legacy export for compatibility
export const chatModels = fallbackChatModels;
