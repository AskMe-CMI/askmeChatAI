/**
 * API React Hooks
 * Custom hooks สำหรับจัดการ API calls ใน React components
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AuthService,
  ChatService,
  DifyService,
  FileService,
  HealthService,
  type LoginRequest,
  type LoginResponse,
  type UserProfile,
  type ChatSession,
  type SendMessageRequest,
  type ChatMessage,
} from './api-services';
import type { ApiResponse } from './api-client';

// ===============================
// TYPES
// ===============================
interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ===============================
// BASE HOOK
// ===============================
function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {},
) {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall();

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
        onSuccess?.(response.data);
      } else {
        const errorMessage =
          response.error || response.message || 'Unknown error';
        setState({ data: null, loading: false, error: errorMessage });
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Network error';
      setState({ data: null, loading: false, error: errorMessage });
      onError?.(errorMessage);
    }
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// ===============================
// AUTH HOOKS
// ===============================

/**
 * Hook สำหรับ login
 */
export function useLogin() {
  const [state, setState] = useState<ApiState<LoginResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const login = useCallback(
    async (credentials: LoginRequest, useMock = false) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = useMock
          ? await AuthService.mockLogin(credentials)
          : await AuthService.login(credentials);

        if (response.success && response.data) {
          setState({ data: response.data, loading: false, error: null });
          return response.data;
        } else {
          const errorMessage =
            response.error || response.message || 'Login failed';
          setState({ data: null, loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Login failed';
        setState({ data: null, loading: false, error: errorMessage });
        throw error;
      }
    },
    [],
  );

  return {
    ...state,
    login,
  };
}

/**
 * Hook สำหรับ verify token
 */
export function useVerifyToken() {
  return useCallback(
    async (token: string, useMock = false): Promise<UserProfile | null> => {
      try {
        const response = useMock
          ? await AuthService.mockVerifyToken(token)
          : await AuthService.verifyToken(token);

        return response.success && response.data ? response.data : null;
      } catch (error) {
        console.error('Token verification failed:', error);
        return null;
      }
    },
    [],
  );
}

/**
 * Hook สำหรับ user profile
 */
export function useProfile(token?: string) {
  const apiCall = useCallback(() => {
    if (!token) throw new Error('Token required');
    return AuthService.getProfile(token);
  }, [token]);

  return useApi<UserProfile>(apiCall, { immediate: !!token });
}

/**
 * Hook สำหรับ logout
 */
export function useLogout() {
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async (token: string) => {
    setLoading(true);
    try {
      await AuthService.logout(token);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { logout, loading };
}

// ===============================
// CHAT HOOKS
// ===============================

/**
 * Hook สำหรับ chat sessions
 */
export function useChatSessions(token?: string) {
  const apiCall = useCallback(() => {
    if (!token) throw new Error('Token required');
    return ChatService.getSessions(token);
  }, [token]);

  return useApi<ChatSession[]>(apiCall, { immediate: !!token });
}

/**
 * Hook สำหรับ chat session เดียว
 */
export function useChatSession(sessionId?: string, token?: string) {
  const apiCall = useCallback(() => {
    if (!sessionId || !token) throw new Error('Session ID and token required');
    return ChatService.getSession(sessionId, token);
  }, [sessionId, token]);

  return useApi<ChatSession>(apiCall, { immediate: !!(sessionId && token) });
}

/**
 * Hook สำหรับส่งข้อความ
 */
export function useSendMessage() {
  const [state, setState] = useState<ApiState<ChatMessage>>({
    data: null,
    loading: false,
    error: null,
  });

  const sendMessage = useCallback(
    async (data: SendMessageRequest, token: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await ChatService.sendMessage(data, token);

        if (response.success && response.data) {
          setState({ data: response.data, loading: false, error: null });
          return response.data;
        } else {
          const errorMessage =
            response.error || response.message || 'Failed to send message';
          setState({ data: null, loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message';
        setState({ data: null, loading: false, error: errorMessage });
        throw error;
      }
    },
    [],
  );

  return {
    ...state,
    sendMessage,
  };
}

// ===============================
// DIFY HOOKS
// ===============================

/**
 * Hook สำหรับ Dify chat
 */
export function useDifyChat() {
  const [state, setState] = useState<ApiState<any>>({
    data: null,
    loading: false,
    error: null,
  });

  const sendMessage = useCallback(
    async (message: string, user: string, conversationId?: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await DifyService.sendMessage({
          inputs: {},
          query: message,
          response_mode: 'blocking',
          conversation_id: conversationId,
          user,
        });

        if (response.success && response.data) {
          setState({ data: response.data, loading: false, error: null });
          return response.data;
        } else {
          const errorMessage =
            response.error ||
            response.message ||
            'Failed to send message to Dify';
          setState({ data: null, loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to send message to Dify';
        setState({ data: null, loading: false, error: errorMessage });
        throw error;
      }
    },
    [],
  );

  return {
    ...state,
    sendMessage,
  };
}

// ===============================
// FILE HOOKS
// ===============================

/**
 * Hook สำหรับ upload file
 */
export function useFileUpload() {
  const [state, setState] = useState<ApiState<{ url: string; id: string }>>({
    data: null,
    loading: false,
    error: null,
  });

  const uploadFile = useCallback(async (file: File, token: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await FileService.uploadFile(file, token);

      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
        return response.data;
      } else {
        const errorMessage =
          response.error || response.message || 'File upload failed';
        setState({ data: null, loading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'File upload failed';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  return {
    ...state,
    uploadFile,
  };
}

// ===============================
// HEALTH HOOKS
// ===============================

/**
 * Hook สำหรับ health check
 */
export function useHealthCheck(interval?: number) {
  const [status, setStatus] = useState<{
    backend: { online: boolean; error?: string };
    dify: { online: boolean; error?: string };
  }>({
    backend: { online: false },
    dify: { online: false },
  });

  const checkHealth = useCallback(async () => {
    try {
      const results = await HealthService.checkAllServices();

      setStatus({
        backend: {
          online: results.backend.success,
          error: results.backend.success ? undefined : results.backend.error,
        },
        dify: {
          online: results.dify.success,
          error: results.dify.success ? undefined : results.dify.error,
        },
      });
    } catch (error) {
      setStatus({
        backend: { online: false, error: 'Failed to check' },
        dify: { online: false, error: 'Failed to check' },
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();

    if (interval && interval > 0) {
      const intervalId = setInterval(checkHealth, interval);
      return () => clearInterval(intervalId);
    }
  }, [checkHealth, interval]);

  return {
    ...status,
    refresh: checkHealth,
  };
}

// ===============================
// UTILITY HOOKS
// ===============================

/**
 * Hook สำหรับ debounce API calls
 */
export function useDebounceApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  delay = 500,
) {
  const [debouncedCall, setDebouncedCall] = useState<() => void>();

  const execute = useCallback(() => {
    if (debouncedCall) {
      clearTimeout(debouncedCall as any);
    }

    const timeoutId = setTimeout(() => {
      apiCall();
    }, delay);

    setDebouncedCall(() => () => clearTimeout(timeoutId));
  }, [apiCall, delay, debouncedCall]);

  return { execute };
}
