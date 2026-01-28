'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { signInWithAPI, signOutFromAPI } from '@/lib/auth/local-auth';

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

const BACKEND_API_URL = 'http://192.168.9.14:8000';

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
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const fullName = formData.get('fullName') as string;

    // Validate inputs
    if (!email || !password || !confirmPassword || !fullName) {
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

    // Call register API (Server-side fetch)
    const response = await fetch(`${BACKEND_API_URL}/api/v1/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
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
