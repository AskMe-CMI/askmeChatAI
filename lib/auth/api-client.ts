/**
 * API Client for authentication with backend
 */

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000/api/mock';

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
  id: string;
  email: string;
  emailRmutl: string;
  name?: string;
  role?: string;
  userDify?: string;
}

/**
 * Login to backend API
 */
export async function loginWithBackend(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  try {
    console.log('URL:', BACKEND_API_URL);
    
    const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Login failed',
      };
    }

    return {
      success: true,
      user: {
        ...data.user,
        emailRmutl: `R${data.user.email}`,
      },
      token: data.token,
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
 * Verify token with backend API
 */
export async function verifyTokenWithBackend(
  token: string,
): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
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
    const response = await fetch(`${BACKEND_API_URL}/auth/logout`, {
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
