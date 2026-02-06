/**
 * API Client for authentication with backend
 */

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    emailRmutl?: string;
    name?: string;
    role?: string;
    userDify?: string;
  };
  token?: string;
  message?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  spend_limit: number;
}

/**
 * Login to backend API
 */
export async function loginWithBackend(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  try {
    console.log('Login URL:', `${BACKEND_API_URL}/api/v1/login`);

    const response = await fetch(`${BACKEND_API_URL}/api/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    // Check content type json
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      // Handle non-JSON response (e.g., 404 HTML page)
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 100)); // Log first 100 chars
      return {
        success: false,
        message: `Server returned ${response.status} ${response.statusText}`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: data.detail || data.message || `Login failed with status ${response.status}`,
      };
    }

    // API returns { access_token, token_type } per Swagger spec
    // User info not returned from login, construct from email
    const user = {
      id: '0',
      email: credentials.email,
      emailRmutl: '',
      name: credentials.email.split('@')[0]
    };

    return {
      success: true,
      user: {
        ...user,
        emailRmutl: user.emailRmutl || `R${user.email}`,
      },
      token: data.access_token,
    };
  } catch (error) {
    console.error('Login API error:', error);
    return {
      success: false,
      message: 'Network error or server unavailable',
    };
  }
}

/**
 * Verify token and get user profile from backend API
 */
export async function verifyTokenWithBackend(
  token: string,
): Promise<UserProfile | null> {
  try {
    // Use /api/v1/users/me endpoint per Swagger spec
    const response = await fetch(`${BACKEND_API_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        return null;
      }
      // Other errors, log but return null
      console.warn(`Verify token failed status: ${response.status}`);
      return null;
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Logout from backend API
 */
export async function logoutFromBackend(token: string): Promise<boolean> {
  try {
    // Assuming /api/logout
    const response = await fetch(`${BACKEND_API_URL}/api/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Logout API error:', error);
    return false;
  }
}

/**
 * Verify email with backend API
 */
export async function verifyEmailWithBackend(token: string): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('Verify email URL:', `${BACKEND_API_URL}/api/v1/verify-email-api`);
    const response = await fetch(`${BACKEND_API_URL}/api/v1/verify-email-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    console.log('Verify email response:', data);
    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Please verify your email address. Check your inbox for the verification link.`,
      };
    }

    return {
      success: true,
      message: data.message || 'Email verified successfully',
    };
  } catch (error) {
    console.error('Verify email API error:', error);
    return {
      success: false,
      message: 'Network error or server unavailable',
    };
  }
}
