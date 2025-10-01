'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// We no longer need database queries
// import { createUser, getUser } from '@/lib/db/queries';

import { signIn, signOut as authSignOut } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    // Allow specific admin credentials to login
    if (
      validatedData.email === 'admin@askme.co.th' &&
      validatedData.password === 'Pa55w.rd'
    ) {
      const token = await signIn(validatedData.email, validatedData.password);

      // Revalidate after successful login
      revalidatePath('/');
      return { status: 'success' };
    } else {
      return { status: 'failed' };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    console.error('Login failed:', error);
    return { status: 'failed' };
  }
};

export async function signOut() {
  await authSignOut();
  // Force redirect to login page
  redirect('/login');
}
