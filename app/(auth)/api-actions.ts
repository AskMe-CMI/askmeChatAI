'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { signInWithAPI, signOutFromAPI, getStoredToken } from '@/lib/auth/local-auth';

// Tpyes for Credit/Token Usage
export interface TokenUsage {
  used: number;
  limit: number;
  remaining: number;
  percentage_used: number;
  expiry_date: string | null;
}

export interface UsageDetails {
  request_count: number;
  spend: number;
}

export interface UserStatus {
  is_active: boolean;
  is_blocked: boolean;
  limit_reached: boolean;
  limit_expired: boolean;
}

export interface UsageStatsResponse {
  user_id: string;
  email: string;
  tokens: TokenUsage;
  usage: UsageDetails;
  status: UserStatus;
}

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
  message?: string;
}

/**
 * Login action that calls backend API
 */
export async function loginWithBackendAPI(
  prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    console.log('Processing login for:', validatedData.email);

    const result = await signInWithAPI(validatedData);

    if (result.success) {
      console.log('Login successful, revalidating path');
      revalidatePath('/');
      return { status: 'success' };
    } else {
      console.log('Login failed:', result.message);
      return {
        status: 'failed',
        message: result.message || 'Invalid credentials',
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: 'invalid_data',
        message: 'Please check your email and password format',
      };
    }

    console.error('Login action error:', error);
    return {
      status: 'failed',
      message: 'Login failed. Please try again.',
    };
  }
}

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export interface RegisterActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
  message?: string;
}

/**
 * Register action that calls backend API
 */
export async function registerWithBackendAPI(
  prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  try {
    const username = formData.get('username') as string;
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate inputs
    if (!username || !fullName || !email || !password || !confirmPassword) {
      return {
        status: 'invalid_data',
        message: 'Please fill in all fields',
      };
    }

    if (password !== confirmPassword) {
      return {
        status: 'invalid_data',
        message: 'Passwords do not match',
      };
    }

    if (password.length < 6) {
      return {
        status: 'invalid_data',
        message: 'Password must be at least 6 characters',
      };
    }

    console.log('Registering user:', email);

    // Prepare registration data matching Backend API spec
    const registrationData = {
      email,
      username,
      password,
      full_name: fullName,
      consent: true,
    };
    console.log('Registration request body:', JSON.stringify(registrationData));

    // Call register API (Server-side fetch)
    const response = await fetch(`${BACKEND_API_URL}/api/v1/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    });

    // Always try to parse JSON
    let data;
    try {
      data = await response.json();
      console.log('Registration response:', data);
    } catch (e) {
      console.error('Failed to parse registration response:', e);
      if (response.ok) {
        // If OK but no JSON, assume success (e.g. 201 Created empty body)
        return {
          status: 'success',
          message: 'Registration successful! Please login.',
        };
      }
    }

    if (response.ok) {
      // Check if data contains errors even with 200 OK (some APIs do this)
      if (data && (data.error || data.message === 'failed')) {
        return {
          status: 'failed',
          message: data.message || data.error || 'Registration failed',
        };
      }

      // Normal success case (User object returned as per spec)
      return {
        status: 'success',
        message: 'Registration successful! Please login.',
      };
    }

    // Handle error responses
    let errorMessage = 'Registration failed';
    if (data) {
      if (data.detail && Array.isArray(data.detail)) {
        // Handle Pydantic validation errors (array of objects)
        errorMessage = data.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
      } else if (data.detail) {
        errorMessage = data.detail;
      } else {
        errorMessage = data.message || 'Registration failed';
      }
    }

    return {
      status: 'failed',
      message: errorMessage,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      status: 'failed',
      message: 'An error occurred during registration',
    };
  }
}

/**
 * Logout action
 */
export async function logoutFromBackendAPI(): Promise<void> {
  try {
    await signOutFromAPI();
    revalidatePath('/');
  } catch (error) {
    console.error('Logout action error:', error);
  }
}

/**
 * Get usage stats from backend API
 * Uses /api/token-usage/my-usage endpoint
 */
export async function getUsageStatsAction(): Promise<{ success: boolean; data?: UsageStatsResponse; message?: string }> {
  try {
    const token = await getStoredToken();

    if (!token) {
      return {
        success: false,
        message: 'Not authenticated',
      };
    }

    const response = await fetch(`${BACKEND_API_URL}/api/token-usage/my-usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      },
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, message: 'Session expired' };
      }
      return { success: false, message: `Failed to fetch stats: ${response.status}` };
    }

    // Response format from /api/token-usage/my-usage:
    // {
    //   "user_id": 17,
    //   "email": "user@example.com",
    //   "tokens_used": 27943,
    //   "token_limit": 10000,
    //   "tokens_remaining": 0,
    //   "usage_percentage": 279.43,
    //   "limit_reached": true,
    //   "limit_expiry_date": null
    // }
    const rawData = await response.json();

    // Transform to UsageStatsResponse format
    const data: UsageStatsResponse = {
      user_id: String(rawData.user_id),
      email: rawData.email,
      tokens: {
        used: rawData.tokens_used || 0,
        limit: rawData.token_limit || 0,
        remaining: Math.max(rawData.tokens_remaining || 0, 0),
        percentage_used: rawData.usage_percentage || 0,
        expiry_date: rawData.limit_expiry_date || null,
      },
      usage: {
        request_count: 0, // Not provided by this endpoint
        spend: 0, // Not provided by this endpoint
      },
      status: {
        is_active: true,
        is_blocked: false,
        limit_reached: rawData.limit_reached || false,
        limit_expired: false,
      },
    };

    return { success: true, data };

  } catch (error) {
    console.error('Get usage stats error:', error);
    return {
      success: false,
      message: 'Failed to fetch usage statistics',
    };
  }
}
