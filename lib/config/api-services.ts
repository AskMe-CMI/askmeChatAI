/**
 * API Service Manager
 * ไฟล์นี้รวบรวม services ทั้งหมดสำหรับ API calls
 */

import { internalApi, backendApi, difyApi } from './api-client';
import type { ApiResponse } from './api-client';
import { API_ENDPOINTS } from './api-config';

// ===============================
// AUTH INTERFACES
// ===============================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  userDify: string; // Dify user ID for AI integration
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ===============================
// CHAT INTERFACES
// ===============================
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  userId: string;
}

export interface SendMessageRequest {
  message: string;
  sessionId?: string;
  context?: Record<string, any>;
}

// ===============================
// DIFY INTERFACES
// ===============================
export interface DifyMessage {
  inputs: Record<string, any>;
  query: string;
  response_mode: 'streaming' | 'blocking';
  conversation_id?: string;
  user: string;
}

export interface DifyResponse {
  answer: string;
  conversation_id: string;
  created_at: number;
  id: string;
}

// ===============================
// AUTH SERVICES
// ===============================
export const AuthService = {
  /**
   * Login with backend API
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return await backendApi.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
  },

  /**
   * Login with mock API (for development)
   */
  async mockLogin(
    credentials: LoginRequest,
  ): Promise<ApiResponse<LoginResponse>> {
    return await internalApi.post<LoginResponse>(
      API_ENDPOINTS.MOCK.AUTH.LOGIN,
      credentials,
    );
  },

  /**
   * Verify token
   */
  async verifyToken(token: string): Promise<ApiResponse<UserProfile>> {
    return await backendApi.get<UserProfile>(API_ENDPOINTS.AUTH.VERIFY, {
      token,
    });
  },

  /**
   * Verify token with mock API
   */
  async mockVerifyToken(token: string): Promise<ApiResponse<UserProfile>> {
    return await internalApi.get<UserProfile>(API_ENDPOINTS.MOCK.AUTH.VERIFY, {
      token,
    });
  },

  /**
   * Refresh token
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<ApiResponse<LoginResponse>> {
    return await backendApi.post<LoginResponse>(API_ENDPOINTS.AUTH.REFRESH, {
      refreshToken,
    });
  },

  /**
   * Logout
   */
  async logout(token: string): Promise<ApiResponse<void>> {
    return await backendApi.post<void>(
      API_ENDPOINTS.AUTH.LOGOUT,
      {},
      { token },
    );
  },

  /**
   * Get user profile
   */
  async getProfile(token: string): Promise<ApiResponse<UserProfile>> {
    return await backendApi.get<UserProfile>(API_ENDPOINTS.AUTH.PROFILE, {
      token,
    });
  },

  /**
   * Update user profile
   */
  async updateProfile(
    profile: Partial<UserProfile>,
    token: string,
  ): Promise<ApiResponse<UserProfile>> {
    return await backendApi.put<UserProfile>(
      API_ENDPOINTS.AUTH.PROFILE,
      profile,
      { token },
    );
  },

  /**
   * Change password
   */
  async changePassword(
    data: ChangePasswordRequest,
    token: string,
  ): Promise<ApiResponse<void>> {
    return await backendApi.post<void>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      data,
      { token },
    );
  },
} as const;

// ===============================
// CHAT SERVICES
// ===============================
export const ChatService = {
  /**
   * Get chat sessions
   */
  async getSessions(token: string): Promise<ApiResponse<ChatSession[]>> {
    return await backendApi.get<ChatSession[]>(API_ENDPOINTS.CHAT.SESSIONS, {
      token,
    });
  },

  /**
   * Get specific chat session
   */
  async getSession(
    sessionId: string,
    token: string,
  ): Promise<ApiResponse<ChatSession>> {
    return await backendApi.get<ChatSession>(
      `${API_ENDPOINTS.CHAT.SESSIONS}/${sessionId}`,
      { token },
    );
  },

  /**
   * Create new chat session
   */
  async createSession(
    title: string,
    token: string,
  ): Promise<ApiResponse<ChatSession>> {
    return await backendApi.post<ChatSession>(
      API_ENDPOINTS.CHAT.SESSIONS,
      { title },
      { token },
    );
  },

  /**
   * Update chat session
   */
  async updateSession(
    sessionId: string,
    data: Partial<ChatSession>,
    token: string,
  ): Promise<ApiResponse<ChatSession>> {
    return await backendApi.put<ChatSession>(
      `${API_ENDPOINTS.CHAT.SESSIONS}/${sessionId}`,
      data,
      { token },
    );
  },

  /**
   * Delete chat session
   */
  async deleteSession(
    sessionId: string,
    token: string,
  ): Promise<ApiResponse<void>> {
    return await backendApi.delete<void>(
      `${API_ENDPOINTS.CHAT.SESSIONS}/${sessionId}`,
      { token },
    );
  },

  /**
   * Send message
   */
  async sendMessage(
    data: SendMessageRequest,
    token: string,
  ): Promise<ApiResponse<ChatMessage>> {
    return await backendApi.post<ChatMessage>(
      API_ENDPOINTS.CHAT.MESSAGES,
      data,
      { token },
    );
  },

  /**
   * Get messages for session
   */
  async getMessages(
    sessionId: string,
    token: string,
  ): Promise<ApiResponse<ChatMessage[]>> {
    return await backendApi.get<ChatMessage[]>(
      `${API_ENDPOINTS.CHAT.SESSIONS}/${sessionId}/messages`,
      { token },
    );
  },
} as const;

// ===============================
// DIFY SERVICES
// ===============================
// DIFY SERVICES
// ===============================
export const DifyService = {
  /**
   * Send message to Dify API
   */
  async sendMessage(data: DifyMessage): Promise<ApiResponse<DifyResponse>> {
    return await difyApi.post<DifyResponse>(API_ENDPOINTS.DIFY.CHAT, data);
  },

  /**
   * Get conversation history
   */
  async getConversations(user: string): Promise<ApiResponse<any[]>> {
    return await difyApi.get<any[]>(
      `${API_ENDPOINTS.DIFY.CONVERSATIONS}?user=${user}`,
    );
  },

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<ApiResponse<void>> {
    return await difyApi.delete<void>(
      `${API_ENDPOINTS.DIFY.CONVERSATIONS}/${conversationId}`,
    );
  },

  /**
   * Get conversation messages
   */
  async getConversationMessages(
    conversationId: string,
  ): Promise<ApiResponse<any[]>> {
    return await difyApi.get<any[]>(
      `${API_ENDPOINTS.DIFY.CONVERSATIONS}/${conversationId}/messages`,
    );
  },
} as const;

// ===============================
// FILE SERVICES
// ===============================
// FILE SERVICES
// ===============================
export const FileService = {
  /**
   * Upload file
   */
  async uploadFile(
    file: File,
    token: string,
  ): Promise<ApiResponse<{ url: string; id: string }>> {
    return await backendApi.uploadFile<{ url: string; id: string }>(
      API_ENDPOINTS.FILES.UPLOAD,
      file,
      { token },
    );
  },

  /**
   * Delete file
   */
  async deleteFile(fileId: string, token: string): Promise<ApiResponse<void>> {
    return await backendApi.delete<void>(
      `${API_ENDPOINTS.FILES.DELETE}/${fileId}`,
      { token },
    );
  },

  /**
   * Get file info
   */
  async getFileInfo(fileId: string, token: string): Promise<ApiResponse<any>> {
    return await backendApi.get<any>(`${API_ENDPOINTS.FILES.INFO}/${fileId}`, {
      token,
    });
  },
} as const;

// ===============================
// HEALTH CHECK SERVICE
// ===============================
export const HealthService = {
  /**
   * Check backend health
   */
  async checkBackendHealth(): Promise<
    ApiResponse<{ status: string; timestamp: number }>
  > {
    return await backendApi.get<{ status: string; timestamp: number }>(
      API_ENDPOINTS.HEALTH.BACKEND,
    );
  },

  /**
   * Check Dify health
   */
  async checkDifyHealth(): Promise<
    ApiResponse<{ status: string; timestamp: number }>
  > {
    return await difyApi.get<{ status: string; timestamp: number }>(
      API_ENDPOINTS.HEALTH.DIFY,
    );
  },

  /**
   * Check all services health
   */
  async checkAllServices(): Promise<{
    backend: ApiResponse<any>;
    dify: ApiResponse<any>;
  }> {
    const [backend, dify] = await Promise.allSettled([
      this.checkBackendHealth(),
      this.checkDifyHealth(),
    ]);

    return {
      backend:
        backend.status === 'fulfilled'
          ? backend.value
          : { success: false, status: 0, error: 'Failed to connect' },
      dify:
        dify.status === 'fulfilled'
          ? dify.value
          : { success: false, status: 0, error: 'Failed to connect' },
    };
  },
} as const;

// ===============================
// EXPORTS
// ===============================
export {
  AuthService as Auth,
  ChatService as Chat,
  DifyService as Dify,
  FileService as Files,
  HealthService as Health,
};

// Default export object
const defaultExport = {
  Auth: AuthService,
  Chat: ChatService,
  Dify: DifyService,
  Files: FileService,
  Health: HealthService,
};

export default defaultExport;
