// Dummy database queries for demo purposes
// In a real application, you would implement actual database logic

export interface Chat {
  id: string;
  title: string;
  userId: string;
  visibility: 'public' | 'private';
  // optional conversation id from external providers (e.g., Dify)
  conversationId?: string;
  // optional message id from external providers (e.g., Dify)
  messageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  // Optional content string (legacy) — prefer `parts` for structured content
  content?: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{
    type: string;
    text?: string;
    url?: string;
    filename?: string;
    mediaType?: string;
  }>;
  attachments: Array<{
    name: string;
    url: string;
    contentType: string;
  }>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  // Make kind required to match callers that expect a defined kind
  kind: 'code' | 'text' | 'image' | 'sheet';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Suggestion {
  id: string;
  documentId: string;
  userId: string;
  // Allow multiple fields used across the app
  content?: string;
  originalText?: string;
  suggestedText?: string;
  description?: string;
  createdAt: Date;
}

export interface Vote {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
}

// Use global variable to persist data across hot reloads
declare global {
  var __dev_chats: Chat[] | undefined;
  var __dev_messages: Message[] | undefined;
}

// Initialize dummy data (persistent across hot reloads)
if (!global.__dev_chats) {
  global.__dev_chats = [
    {
      id: '1',
      title: 'Demo Chat',
      userId: '12345',
      visibility: 'public',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Add test chat with conversation ID
    {
      id: 'e5941bd1-9d89-4af0-8efa-583989a19620',
      title: 'Test Chat with Conversation ID',
      userId: '1',
      visibility: 'private',
      conversationId: 'e5941bd1-9d89-4af0-8efa-583989a19620', // Use same ID as chat ID
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
  ];
}

if (!global.__dev_messages) {
  global.__dev_messages = [
    {
      id: '1',
      chatId: '1',
      content: 'Hello! How can I help you?',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Hello! How can I help you?' }],
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

// Reference the global arrays
const dummyChats = global.__dev_chats;
const dummyMessages = global.__dev_messages;

// Chat queries
export async function getChatById({
  id,
}: { id: string }): Promise<Chat | null> {
  const chat = dummyChats.find((chat) => chat.id === id) || null;
  console.log('🔍 getChatById Debug:', {
    requestedId: id,
    foundChat: chat
      ? {
          id: chat.id,
          title: chat.title,
          conversationId: chat.conversationId,
          userId: chat.userId,
        }
      : null,
    totalChatsInMemory: dummyChats.length,
    allChatIds: dummyChats.map((c) => c.id),
  });
  return chat;
}

export async function getMessagesByChatId({
  id,
}: { id: string }): Promise<Message[]> {
  return dummyMessages.filter((message) => message.chatId === id);
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit?: number;
  startingAfter?: string | null;
  endingBefore?: string | null;
}): Promise<Chat[]> {
  return dummyChats.filter((chat) => chat.userId === id).slice(0, limit || 10);
}

export async function saveChat(
  chat: Omit<Chat, 'createdAt' | 'updatedAt'>,
): Promise<Chat> {
  const existingIndex = dummyChats.findIndex((c) => c.id === chat.id);
  const newChat: Chat = {
    ...chat,
    createdAt:
      existingIndex >= 0 ? dummyChats[existingIndex].createdAt : new Date(),
    updatedAt: new Date(),
  };

  if (existingIndex >= 0) {
    // preserve any missing optional fields from the existing record
    dummyChats[existingIndex] = {
      ...dummyChats[existingIndex],
      ...newChat,
    };
  } else {
    dummyChats.push(newChat);
  }
  return newChat;
}

export async function deleteChatById({
  id,
}: { id: string }): Promise<Chat | null> {
  const index = dummyChats.findIndex((chat) => chat.id === id);
  if (index >= 0) {
    return dummyChats.splice(index, 1)[0];
  }
  return null;
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}): Promise<number> {
  // Dummy implementation - return 0 for now
  return 0;
}

export async function saveMessage(
  message: Omit<Message, 'id' | 'createdAt'>,
): Promise<Message> {
  const id = Math.random().toString(36).substring(7);

  const newMessage: Message = {
    ...message,
    id,
    parts: message.parts ?? [{ type: 'text', text: message.content ?? '' }],
    attachments: message.attachments ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dummyMessages.push(newMessage);
  return newMessage;
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}): Promise<void> {
  // Remove messages after timestamp
  const index = dummyMessages.findIndex(
    (message) => message.chatId === chatId && message.createdAt > timestamp,
  );
  if (index !== -1) {
    dummyMessages.splice(index);
  }
}

export async function updateChatVisiblity({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'public' | 'private';
}): Promise<void> {
  const chat = dummyChats.find((c) => c.id === chatId);
  if (chat) {
    chat.visibility = visibility;
    chat.updatedAt = new Date();
  }
}

// Document queries
export async function getDocumentById(id: string): Promise<Document | null> {
  return null; // Dummy implementation
}

export async function getDocumentsByUserId({
  id,
}: { id: string }): Promise<Document[]> {
  return []; // Dummy implementation
}

export async function saveDocument(
  document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Document> {
  return {
    ...document,
    id: Math.random().toString(36).substring(7),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}): Promise<void> {
  // Dummy implementation
}

// Suggestion queries
export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}): Promise<Suggestion[]> {
  return []; // Dummy implementation
}

export async function saveSuggestions(
  suggestions: Array<Omit<Suggestion, 'id' | 'createdAt'>>,
): Promise<Suggestion[]> {
  return suggestions.map((suggestion) => ({
    ...suggestion,
    id: Math.random().toString(36).substring(7),
    createdAt: new Date(),
  }));
}

// Vote queries
export async function getVotesByChatId(chatId: string): Promise<Vote[]> {
  return []; // Dummy implementation
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}): Promise<void> {
  // Dummy implementation
}

// User queries (if needed)
export async function getUser(email: string): Promise<any> {
  if (email === 'admin@askme.co.th') {
    return {
      id: '12345',
      email: 'admin@askme.co.th',
      type: 'regular',
    };
  }
  return null;
}

export async function createUser(user: {
  email: string;
  password: string;
}): Promise<any> {
  // Not implemented since we don't allow registration
  throw new Error('Registration is disabled');
}

// Stream queries for resumable streams
export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}): Promise<void> {
  // Dummy implementation for stream tracking
  console.log(`Created stream ${streamId} for chat ${chatId}`);
}

export async function getStreamIdsByChatId({
  chatId,
}: {
  chatId: string;
}): Promise<string[]> {
  // Dummy implementation
  return [];
}

// Helper type for bulk message saves coming from the app
type DBMessageInput = {
  id?: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  parts?: Array<{ text?: string } | string> | string;
  attachments?: any[];
  createdAt?: Date;
};

/**
 * Save multiple messages. This is a small wrapper around saveMessage
 * to match the API expected elsewhere in the codebase.
 */
export async function saveMessages({
  messages,
}: {
  messages: DBMessageInput[];
}): Promise<Message[]> {
  const saved: Message[] = messages.map((m) => {
    const id = m.id ?? Math.random().toString(36).substring(7);

    // Normalize parts into the structured parts array
    let parts: Message['parts'] = [];

    if (Array.isArray(m.parts)) {
      parts = m.parts.map((p) =>
        typeof p === 'string'
          ? { type: 'text', text: p }
          : { type: 'text', text: p.text ?? '' },
      );
    } else if (typeof m.parts === 'string') {
      parts = [{ type: 'text', text: m.parts }];
    }

    const newMessage: Message = {
      id,
      chatId: m.chatId,
      content: parts.map((p) => p.text ?? '').join(''),
      role: m.role,
      parts,
      attachments: m.attachments ?? [],
      createdAt: m.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    dummyMessages.push(newMessage);
    return newMessage;
  });

  return saved;
}

/**
 * Return documents for a given id. The rest of the code expects an array
 * of documents (to support versioning). This adapts the existing
 * getDocumentById helper to that shape.
 */
export async function getDocumentsById({
  id,
}: { id: string }): Promise<Document[]> {
  const doc = await getDocumentById(id);
  return doc ? [doc] : [];
}
