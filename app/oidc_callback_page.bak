'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useActionState, useTransition, useRef } from 'react';
import { toast } from '@/components/toast';
import { LoaderIcon } from '@/components/icons';
import { loginWithBackendAPI, type LoginActionState } from '@/app/(auth)/api-actions-oidc-mock';

// import { 
//   exchangeCodeForTokens, 
//   getUserInfo, 
//   decodeIdToken,
//   parseOIDCError,
//   type OIDCAuthState 
// } from '@/lib/auth/oidc-provider';

// import { debugOIDCEnvironment } from '@/lib/auth/oidc-config';

export default function OIDCCallbackPage() {
  // export default function OIDCCallbackPage(req: NextApiRequest, res: NextApiResponse) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<string>('Processing authentication...');
  const [state, formAction] = useActionState<LoginActionState, FormData>(
    loginWithBackendAPI,
    {
      status: 'idle',
    },
  );
  const [isPending, startTransition] = useTransition();

  // ติดตามการเปลี่ยนแปลงของ state จาก formAction
  useEffect(() => {
    console.log('state!: ',state);
    
    if (state.status === 'success') {
      console.log('✅ Login successful, redirecting...');
      setStatus('Authentication successful! Redirecting...');
      toast({
        type: 'success',
        description: 'Authentication successful! Welcome to AskMe Chat AI.',
      });

      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else if (state.status === 'registered_success') {
      console.log('✅ Registration successful, redirecting...');
      setStatus('Registration successful! Redirecting...');
      toast({
        type: 'success',
        description: 'Registration successful! Welcome to AskMe Chat AI.',
      });

      // Clear OIDC state
      sessionStorage.removeItem('oidc_state');
      localStorage.removeItem('oidc_state_backup');

      // Use window.location.href for reliable redirect
      try {
        console.log('Redirecting to /register/success via window.location.href');
        window.location.href = '/register/success';
      } catch (err) {
        console.error('Redirect failed:', err);
      }
    } else if (state.status === 'failed') {
      console.error('❌ Login failed:', state.message);
      setStatus('Authentication failed');
      toast({
        type: 'error',
        description: state.message || 'Authentication failed. Please try again.',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  }, [state, router]);

  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (processedRef.current) return;

    const processCallback = async () => {
      try {
        // ... (rest of the logic)
        processedRef.current = true;

        // ...
        // call api/oidc-callback to get authorization URL
        const code = searchParams.get('code') || '';
        const state = searchParams.get('state') || '';
        const session_state = searchParams.get('session_state') || '';
        if (!code || !state) {
          toast({
            type: 'error',
            description: 'Invalid callback parameters',
          });
          // router.push('/login');
          return;
        }
        const response = await fetch('/api-i/auth/oidc-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state, session_state }),
        });
        const data = await response.json();
        console.log('Received OIDC callback response from server:', data);
        const userInfo = data.user;
        // เตรียม FormData สำหรับ loginWithBackendAPI
        const formData = new FormData();

        // ใช้ session_state เป็น email หรือสร้าง unique email
        const userEmail = session_state
          ? `${userInfo.email}`
          // ? `oidc-${session_state.substring(0, 8)}@rmutl.ac.th`
          : `oidc-${Date.now()}@rmutl.ac.th`;

        formData.set('email', userEmail);
        formData.set('password', 'oidc-authenticated');

        // เพิ่มข้อมูล OIDC parameters เป็น metadata
        formData.set('oidc_code', code);
        formData.set('oidc_state', state);
        if (session_state) {
          formData.set('oidc_session_state', session_state);
        }

        // เรียกใช้ formAction เพื่อ authenticate กับ backend
        startTransition(() => {
          formAction(formData);
        });

      } catch (error) {
        console.error('❌ Callback processing error:', error);
        toast({
          type: 'error',
          description: 'Authentication failed. Please try again.',
        });
        router.push('/login');
      }
    };

    processCallback();
  }, [searchParams, router, formAction, startTransition]);

  // อัพเดท status ตาม formAction state
  useEffect(() => {
    if (isPending) {
      setStatus('Authenticating with backend...');
      setIsProcessing(true);
    } else if (state.status === 'success') {
      setStatus('Authentication successful! Redirecting...');
      setIsProcessing(false);
    } else if (state.status === 'registered_success') {
      setStatus('Registration successful! Redirecting...');
      setIsProcessing(false);
    } else if (state.status === 'failed') {
      setStatus('Authentication failed');
      setIsProcessing(false);
    }
  }, [isPending, state.status]);

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md flex flex-col items-center gap-6 p-8">
        <div className="flex items-center gap-3">
          <LoaderIcon size={24} />
          <h2 className="text-xl font-semibold dark:text-zinc-50">
            Authenticating with OIDC...
          </h2>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {status}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Processing your Microsoft authentication
          </p>

          {/* แสดงสถานะของ formAction */}
          {state.status === 'failed' && state.message && (
            <p className="text-xs text-red-500 mt-2">
              Error: {state.message}
            </p>
          )}

          {isPending && (
            <p className="text-xs text-blue-500 mt-2">
              Contacting backend server...
            </p>
          )}
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-in-out"
            style={{
              width: isPending ? '70%' :
                state.status === 'success' ? '100%' :
                  state.status === 'registered_success' ? '100%' :
                  state.status === 'failed' ? '100%' : '50%'
            }}
          />
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400">
            Callback URL: {process.env.NEXT_PUBLIC_OIDC_CALLBACK_URL}
          </p>

          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-2">
            <p>FormAction Status: {state.status}</p>
            <p>Is Pending: {isPending ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}