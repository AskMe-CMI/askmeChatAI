/**
 * API Management System - Main Index
 * จุดรวบรวมทุกอย่างที่เกี่ยวข้องกับ API management
 */

// ===============================
// CONVENIENCE EXPORTS
// ===============================

// Default API clients
export { internalApi, backendApi, difyApi } from './api-client';

// Services grouped by functionality
export {
  AuthService,
  ChatService,
  DifyService,
  FileService,
  HealthService,
} from './api-services';

// Configuration
export { API_CONFIG, API_ENDPOINTS, API_HEADERS } from './api-config';

// React Hooks
export {
  useLogin,
  useVerifyToken,
  useProfile,
  useLogout,
  useChatSessions,
  useChatSession,
  useSendMessage,
  useDifyChat,
  useFileUpload,
  useHealthCheck,
  useDebounceApi,
} from './api-hooks';

// Types
export type { ApiResponse } from './api-client';
export type {
  LoginRequest,
  LoginResponse,
  UserProfile,
  ChatMessage,
  ChatSession,
  SendMessageRequest,
  DifyMessage,
  DifyResponse,
} from './api-services';

// ===============================
// QUICK SETUP FUNCTIONS
// ===============================

/**
 * Initialize API system
 */
export function initializeApiSystem() {
  console.log('✅ API System initialized successfully');
  return { success: true };
}

/**
 * Get API status for all services
 */
export async function getApiStatus() {
  const { HealthService } = await import('./api-services');

  try {
    const results = await HealthService.checkAllServices();

    return {
      timestamp: new Date().toISOString(),
      services: {
        backend: {
          status: results.backend.success ? 'online' : 'offline',
          error: results.backend.error,
        },
        dify: {
          status: results.dify.success ? 'online' : 'offline',
          error: results.dify.error,
        },
      },
      overall:
        results.backend.success && results.dify.success
          ? 'healthy'
          : 'degraded',
    };
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      services: {
        backend: { status: 'offline', error: 'Health check failed' },
        dify: { status: 'offline', error: 'Health check failed' },
      },
      overall: 'offline',
    };
  }
}
