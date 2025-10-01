'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';
import { Separator } from "@/components/ui/separator";

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { MsalButton  } from '@/components/msal-button';

import { loginWithBackendAPI, type LoginActionState } from '../api-actions';
import { lowercase } from 'zod/v4';

declare const process: any;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    loginWithBackendAPI,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: state.message || 'Login failed!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: state.message || 'Please check your input!',
      });
    } else if (state.status === 'success') {
      toast({
        type: 'success',
        description: 'Login successful!',
      });
      // Redirect to dashboard after successful login
      window.location.href = '/';
    }
  }, [state.status, state.message]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your account to continue to RMUTL Chat AI
          </p>
        </div>
        {process.env.NEXT_PUBLIC_ALLOW_LOCAL_LOGIN.toLowerCase() !== 'false' && (
          <>
            <AuthForm action={handleSubmit} defaultEmail={email}>
              <SubmitButton isSuccessful={state.status === 'success'}>
                Sign In
              </SubmitButton>
            </AuthForm>
            <div className="flex flex-col px-4 sm:px-16">
              <Separator className="bg-zinc-600"/>
            </div>
          </>
        )}
        <div className="flex flex-col px-4 sm:px-16">
          <MsalButton isSuccessful={state.status === 'success'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 256 256"><path fill="#F1511B" d="M121.666 121.666H0V0h121.666z"/><path fill="#80CC28" d="M256 121.666H134.335V0H256z"/><path fill="#00ADEF" d="M121.663 256.002H0V134.336h121.663z"/><path fill="#FBBC09" d="M256 256.002H134.335V134.336H256z"/></svg> Sign in with Microsoft
          </MsalButton>
        </div>
      </div>
    </div>
  );
}
