/**
 * API Configuration Management
 * ไฟล์นี้ใช้สำหรับจัดการ API endpoints และ configuration ทั้งหมด
 */

// ===============================
// API BASE URLS
// ===============================
export const API_CONFIG = {
  // Backend API Base URL
  BACKEND_BASE_URL:
    process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000/api',

  // Dify API Configuration
  DIFY_BASE_URL: process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1',
  DIFY_API_KEY: process.env.DIFY_API_KEY || '',

  // Internal API Base URL
  INTERNAL_BASE_URL:
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',

  // Timeout settings
  REQUEST_TIMEOUT: 30000, // 30 seconds

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// ===============================
// API ENDPOINTS
// ===============================
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: `${API_CONFIG.BACKEND_BASE_URL}/auth/login`,
    VERIFY: `${API_CONFIG.BACKEND_BASE_URL}/auth/verify`,
    LOGOUT: `${API_CONFIG.BACKEND_BASE_URL}/auth/logout`,
    REFRESH: `${API_CONFIG.BACKEND_BASE_URL}/auth/refresh`,
    PROFILE: `${API_CONFIG.BACKEND_BASE_URL}/auth/profile`,
    CHANGE_PASSWORD: `${API_CONFIG.BACKEND_BASE_URL}/auth/change-password`,
  },

  // Mock authentication endpoints (for development)
  MOCK: {
    AUTH: {
      LOGIN: `${API_CONFIG.INTERNAL_BASE_URL}/api/mock/auth/login`,
      VERIFY: `${API_CONFIG.INTERNAL_BASE_URL}/api/mock/auth/verify`,
      LOGOUT: `${API_CONFIG.INTERNAL_BASE_URL}/api/mock/auth/logout`,
      REFRESH: `${API_CONFIG.INTERNAL_BASE_URL}/api/mock/auth/refresh`,
    },
  },

  // Dify API endpoints
  DIFY: {
    CHAT: `${API_CONFIG.DIFY_BASE_URL}/chat-messages`,
    CONVERSATIONS: `${API_CONFIG.DIFY_BASE_URL}/conversations`,
    FILES: `${API_CONFIG.DIFY_BASE_URL}/files`,
    FEEDBACK: `${API_CONFIG.DIFY_BASE_URL}/messages/{message_id}/feedbacks`,
  },

  // Internal chat API
  CHAT: {
    SEND_MESSAGE: `${API_CONFIG.INTERNAL_BASE_URL}/api/chat`,
    GET_HISTORY: `${API_CONFIG.INTERNAL_BASE_URL}/api/history`,
    DELETE_CHAT: `${API_CONFIG.INTERNAL_BASE_URL}/api/chat/{id}`,
    SUGGESTIONS: `${API_CONFIG.INTERNAL_BASE_URL}/api/suggestions`,
    SESSIONS: `${API_CONFIG.BACKEND_BASE_URL}/chat/sessions`,
    MESSAGES: `${API_CONFIG.BACKEND_BASE_URL}/chat/messages`,
  },

  // File management
  FILES: {
    UPLOAD: `${API_CONFIG.INTERNAL_BASE_URL}/api/files/upload`,
    DOWNLOAD: `${API_CONFIG.INTERNAL_BASE_URL}/api/files/download`,
    DELETE: `${API_CONFIG.INTERNAL_BASE_URL}/api/files/{id}`,
    INFO: `${API_CONFIG.BACKEND_BASE_URL}/files`,
  },

  // Health check endpoints
  HEALTH: {
    BACKEND: `${API_CONFIG.BACKEND_BASE_URL}/health`,
    DIFY: `${API_CONFIG.DIFY_BASE_URL}/health`,
  },
} as const;

// ===============================
// HTTP HEADERS
// ===============================
export const API_HEADERS = {
  DEFAULT: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  DIFY: {
    Authorization: `Bearer ${API_CONFIG.DIFY_API_KEY}`,
    'Content-Type': 'application/json',
  },

  FORM_DATA: {
    'Content-Type': 'multipart/form-data',
  },

  WITH_AUTH: (token: string) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }),
} as const;

// ===============================
// API RESPONSE STATUS
// ===============================
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ===============================
// ERROR MESSAGES
// ===============================
export const API_ERRORS = {
  NETWORK_ERROR: 'Network error or server unavailable',
  AUTHENTICATION_FAILED: 'Authentication failed',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Session expired, please login again',
  SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  TIMEOUT: 'Request timeout',
} as const;

// ===============================
// ENVIRONMENT DETECTION
// ===============================
export const ENV_CONFIG = {
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',

  // Use mock APIs in development
  USE_MOCK_AUTH:
    process.env.USE_MOCK_AUTH === 'true' ||
    process.env.NODE_ENV === 'development',
  USE_MOCK_DIFY: process.env.USE_MOCK_DIFY === 'true',

  // Debug settings
  ENABLE_API_LOGGING:
    process.env.ENABLE_API_LOGGING === 'true' ||
    process.env.NODE_ENV === 'development',
} as const;

// ===============================
// HELPER FUNCTIONS
// ===============================
export const getAuthEndpoints = () => {
  return ENV_CONFIG.USE_MOCK_AUTH
    ? API_ENDPOINTS.MOCK.AUTH
    : API_ENDPOINTS.AUTH;
};

export const getDifyHeaders = () => {
  if (!API_CONFIG.DIFY_API_KEY) {
    console.warn('DIFY_API_KEY is not configured');
  }
  return API_HEADERS.DIFY;
};

export const logApiCall = (method: string, url: string, data?: any) => {
  if (ENV_CONFIG.ENABLE_API_LOGGING) {
    console.log(`[API] ${method} ${url}`, data ? { data } : '');
  }
};

export const logApiResponse = (
  method: string,
  url: string,
  status: number,
  response?: any,
) => {
  if (ENV_CONFIG.ENABLE_API_LOGGING) {
    console.log(
      `[API] ${method} ${url} - ${status}`,
      response ? { response } : '',
    );
  }
};
