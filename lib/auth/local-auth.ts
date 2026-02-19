import { cookies } from 'next/headers';
import {
  loginWithBackend,
  verifyTokenWithBackend,
  type LoginRequest,
  type UserProfile,
} from '@/lib/auth/api-client';

const COOKIE_NAME = 'session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};

/**
 * Login user with backend API and store token
 */
export async function signInWithAPI(
  credentials: LoginRequest,
): Promise<{ success: boolean; message?: string; isRegistered?: boolean }> {
  try {
    // console.log('Attempting to login with backend API:', credentials.email);

    const result = await loginWithBackend(credentials);

    if (result.success && result.isRegistered) {
      return {
        success: true,
        isRegistered: true,
        message: result.message
      };
    }

    if (!result.success || !result.token) {
      // console.log('Login failed:', result.message);
      return {
        success: false,
        message: result.message || 'Login failed',
      };
    }

    // Store token in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, result.token, COOKIE_OPTIONS);

    // console.log('Login successful, token using:', result.token);
    console.log('Login successful!');
    return {
      success: true,
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      message: 'Authentication error',
    };
  }
}

/**
 * Get current user session by verifying token with backend
 */
export async function getSessionFromAPI(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME);

    if (!token?.value) {
      // console.log('No auth token found');
      return null;
    }

    // Verify token with backend and get user profile
    const user = await verifyTokenWithBackend(token.value);

    if (!user) {
      // Token invalid or expired
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    return user;
  } catch (error) {
    // If this is React's special postpone object used by Next.js to bail out of
    // prerendering when cookies are accessed, rethrow it so Next can handle it.
    if (
      error &&
      typeof error === 'object' &&
      Object.prototype.hasOwnProperty.call(error, '$$typeof')
    ) {
      throw error;
    }

    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Sign out user
 */
export async function signOutFromAPI(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME);

    if (token?.value) {
      // Try to logout from backend (optional, continue even if it fails)
      try {
        const { logoutFromBackend } = await import('./api-client');
        await logoutFromBackend(token.value);
      } catch (error) {
        console.warn('Backend logout failed:', error);
      }
    }

    // Clear local token
    cookieStore.delete(COOKIE_NAME);
    console.log('User signed out');
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

/**
 * Get stored token (for API calls)
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME);
    return token?.value || null;
  } catch (error) {
    console.error('Get token error:', error);
    return null;
  }
}
