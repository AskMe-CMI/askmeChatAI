'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';


import { loginWithBackendAPI, type LoginActionState } from '../api-actions';
import { Button } from '@/components/ui/button';
import { LoaderIcon } from '@/components/icons';


declare const process: any;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
  const handleOIDCLogin = async () => {
    setIsLoading(true);

    try {
      // call api/oidc-auth-url to get authorization URL
      const response = await fetch('/api-i/auth/oidc-auth-url');
      const data = await response.json();
      const { url, state } = data;
      console.log('Received OIDC auth URL and state from server:', { url, state });
      // if(!tenant_id || !client_id || !callback_url) {
      //   throw new Error('Missing OIDC configuration in .env file. Please contact the administrator.');
      // }
      // สร้าง authorization URL และ state
      // const { url, state } = createAuthorizationUrl();

      // console.log('🔐 Starting OIDC login process');
      // console.log('Generated state:', state);
      // console.log('Authorization URL:', url);

      // เก็บ state ใน sessionStorage สำหรับการตรวจสอบ
      sessionStorage.setItem('oidc_state', JSON.stringify(state));
      // console.log('💾 State saved to sessionStorage');

      // เก็บ state ใน localStorage เป็น backup
      localStorage.setItem('oidc_state_backup', JSON.stringify(state));
      // console.log('💾 State backup saved to localStorage');

      // // Redirect ไปยัง Microsoft login
      window.location.href = url;
    } catch (error) {
      console.error('OIDC login error:', error);
      toast({
        type: 'error',
        description: 'Failed to initiate login. Please try again.',
      });
      setIsLoading(false);
    }
  };

  return (
    <>

      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center">
        <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-3">
          <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
            <h3 className="text-xl font-semibold dark:text-zinc-50">Login</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-9">
              Sign in to your AskMe AI Gateway account
            </p>
          </div>
          {/* {process.env.NEXT_PUBLIC_ALLOW_LOCAL_LOGIN.toLowerCase() !== 'false' && ( */}
            <>
              <AuthForm action={handleSubmit} defaultEmail={email}>
                <SubmitButton isSuccessful={state.status === 'success'}>
                  Login
                </SubmitButton>
              </AuthForm>
              {/* <div className="flex flex-col px-4 sm:px-16">
              <Separator className="bg-zinc-600" />
            </div> */}
            </>
          {/* )} */}
          <div className="flex flex-col gap-3 px-4 sm:px-16">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button
              onClick={handleOIDCLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 "
            >
              {isLoading ? (
                <LoaderIcon size={16} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 256 256">
                  <path fill="#F1511B" d="M121.666 121.666H0V0h121.666z" />
                  <path fill="#80CC28" d="M256 121.666H134.335V0H256z" />
                  <path fill="#00ADEF" d="M121.663 256.002H0V134.336h121.663z" />
                  <path fill="#FBBC09" d="M256 256.002H134.335V134.336H256z" />
                </svg>
              )}
              {isLoading ? 'Redirecting...' : 'Login with Microsoft'}
            </Button>

            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">New here? Create account</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/register')}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
