// Database schema definitions
// Export types from queries.ts for consistency

export type {
  Chat,
  Message,
  Document,
  Suggestion,
  Vote,
} from './queries';

// Additional types that might be used in database operations
export interface DBMessage {
  id: string;
  chatId: string;
  content?: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{
  type: string;
  text?: string;
  image?: string;
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

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

// Visibility types
export type VisibilityType = 'public' | 'private';
export type UserRole = 'user' | 'admin';
export type MessageRole = 'user' | 'assistant' | 'system';

// Database operation results
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  startingAfter?: string;
  endingBefore?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}
