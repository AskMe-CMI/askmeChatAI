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
              Log in to your AskMe AI Gateway account
            </p>
          </div>
          {/* {process.env.NEXT_PUBLIC_ALLOW_LOCAL_LOGIN.toLowerCase() !== 'false' && ( */}
          <>
            {/* <AuthForm action={handleSubmit} defaultEmail={email}>
              <SubmitButton isSuccessful={state.status === 'success'}>
                Login
              </SubmitButton>
            </AuthForm> */}
            {/* <div className="flex flex-col px-4 sm:px-16">
                <Separator className="bg-zinc-600" />
              </div> */}
          </>
          {/* )} */}
          {/* <div className="flex flex-col gap-3 px-4 sm:px-16"> */}
          {/* GOOGLE button */}
          {/* <div className="px-4 sm:px-16">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
          </div> */}
          <div className="px-4 sm:px-16">
            <Button
              onClick={async () => {
                setIsLoading(true);
                try {
                  const response = await fetch('/api-i/auth/google-auth-url');
                  const data = await response.json();
                  window.location.href = data.url;
                } catch (err) {
                  toast({ type: 'error', description: 'Failed to get Google auth URL' });
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-400 bg-white hover:bg-white/90 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              {isLoading ? (
                <LoaderIcon size={16} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              )}
              {isLoading ? 'Redirecting to Google...' : 'Login with Google'}
            </Button>
          </div>
          {/* register button */}
          {/* <div className="relative mt-4">
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
            </button> */}
          {/* </div> */}
        </div>
      </div>
    </>
  );
}
