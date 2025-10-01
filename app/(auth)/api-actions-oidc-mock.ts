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
