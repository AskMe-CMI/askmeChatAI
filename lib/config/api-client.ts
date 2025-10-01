/**
 * API Client Manager
 * ไฟล์นี้ใช้สำหรับจัดการ HTTP requests ทั้งหมด
 */

import {
  API_CONFIG,
  API_HEADERS,
  API_ERRORS,
  logApiCall,
  logApiResponse,
} from './api-config';

// ===============================
// TYPES
// ===============================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  token?: string;
}

// ===============================
// API CLIENT CLASS
// ===============================
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private maxRetries: number;

  constructor(
    baseUrl: string = API_CONFIG.INTERNAL_BASE_URL,
    defaultHeaders: Record<string, string> = API_HEADERS.DEFAULT,
    timeout: number = API_CONFIG.REQUEST_TIMEOUT,
    maxRetries: number = API_CONFIG.MAX_RETRIES,
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    url: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      retries = this.maxRetries,
      token,
    } = options;

    // Prepare headers
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Prepare request config
    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      ...(body
        ? { body: typeof body === 'string' ? body : JSON.stringify(body) }
        : {}),
    };

    // Log API call
    logApiCall(method, url, body);

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseData = await this.parseResponse(response);
        logApiResponse(method, url, response.status, responseData);

        return {
          success: response.ok,
          data: responseData,
          status: response.status,
          message: response.ok
            ? 'Success'
            : responseData?.message || 'Request failed',
        };
      } catch (error) {
        lastError = error as Error;

        // If it's the last attempt, don't retry
        if (attempt > retries) {
          break;
        }

        // Wait before retry
        await this.delay(API_CONFIG.RETRY_DELAY * attempt);

        console.warn(
          `API request failed (attempt ${attempt}/${retries + 1}):`,
          error,
        );
      }
    }

    // Return error response
    const errorMessage = this.getErrorMessage(lastError);
    logApiResponse(method, url, 0, { error: errorMessage });

    return {
      success: false,
      status: 0,
      error: errorMessage,
      message: errorMessage,
    };
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    if (contentType?.includes('text/')) {
      return await response.text();
    }

    return await response.blob();
  }

  /**
   * Get error message from error object
   */
  private getErrorMessage(error: Error | null): string {
    if (!error) return API_ERRORS.SERVER_ERROR;

    if (error.name === 'AbortError') {
      return API_ERRORS.TIMEOUT;
    }

    if (error.message.includes('fetch')) {
      return API_ERRORS.NETWORK_ERROR;
    }

    return error.message || API_ERRORS.SERVER_ERROR;
  }

  /**
   * Delay function for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ===============================
  // HTTP METHODS
  // ===============================

  async get<T>(
    endpoint: string,
    options: Omit<RequestOptions, 'method'> = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: 'POST',
      body: data,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: 'PUT',
      body: data,
    });
  }

  async delete<T>(
    endpoint: string,
    options: Omit<RequestOptions, 'method'> = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: 'DELETE',
    });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(`${this.baseUrl}${endpoint}`, {
      ...options,
      method: 'PATCH',
      body: data,
    });
  }

  // ===============================
  // SPECIALIZED METHODS
  // ===============================

  /**
   * Upload file with form data
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData: Record<string, any> = {},
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return this.makeRequest<T>(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  /**
   * Download file
   */
  async downloadFile(endpoint: string, filename?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }
}

// ===============================
// DEFAULT API CLIENTS
// ===============================

// Internal API client
export const internalApi = new ApiClient(
  API_CONFIG.INTERNAL_BASE_URL,
  API_HEADERS.DEFAULT,
);

// Backend API client
export const backendApi = new ApiClient(
  API_CONFIG.BACKEND_BASE_URL,
  API_HEADERS.DEFAULT,
);

// Dify API client
export const difyApi = new ApiClient(
  API_CONFIG.DIFY_BASE_URL,
  API_HEADERS.DIFY,
);

// Export default client
export default internalApi;
