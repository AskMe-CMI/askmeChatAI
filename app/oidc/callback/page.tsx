'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useActionState, useTransition } from 'react';
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
  const[state, formAction] = useActionState<LoginActionState, FormData>(
    loginWithBackendAPI,
    {
      status: 'idle',
    },  
  );
  const [isPending, startTransition] = useTransition();

  // ติดตามการเปลี่ยนแปลงของ state จาก formAction
  useEffect(() => {
    if (state.status === 'success') {
      console.log('✅ Login successful, redirecting...');
      setStatus('Authentication successful! Redirecting...');
      toast({
        type: 'success',
        description: 'Authentication successful! Welcome to RMUTL Chat AI.',
      });
      
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else if (state.status === 'failed') {
      console.error('❌ Login failed:', state.message);
      setStatus('Authentication failed');
      toast({
        type: 'error',
        description: state.message || 'Authentication failed. Please try again.',
      });
      
      setTimeout(() => {
        router.push('/logint');
      }, 2000);
    }
  }, [state, router]);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // ตรวจสอบ OIDC error ก่อน
        // const oidcError = parseOIDCError(searchParams);
        // if (oidcError) {
        //   console.error('OIDC Error:', oidcError);
        //   toast({
        //     type: 'error',
        //     description: oidcError.error_description || `Authentication error: ${oidcError.error}`,
        //   });
        //   router.push('/login');
        //   return;
        // }

        // // ดึง code และ state จาก URL
        // const code = searchParams.get('code');
        // const state = searchParams.get('state');
        // const session_state = searchParams.get('session_state');

        // if (!code || !state) {
        //   toast({
        //     type: 'error',
        //     description: 'Invalid callback parameters',
        //   });
        //   router.push('/login');
        //   return;
        // }

        // // ตรวจสอบว่ามี session_state หรือไม่
        // if (!session_state) {
        //   console.warn('⚠️ No session_state found, proceeding anyway...');
        // }

        // // ดึง stored state จาก sessionStorage หรือสร้างใหม่
        // const storedStateJson = sessionStorage.getItem('oidc_state');
        // let storedState: OIDCAuthState;
        
        // if (!storedStateJson) {
        //   console.warn('⚠️ No stored state found in sessionStorage, creating fallback state');
        //   // console.log('This usually means:');
        //   // console.log('1. User opened callback URL directly');
        //   // console.log('2. SessionStorage was cleared');
        //   // console.log('3. Cross-origin issues');
          
        //   // สร้าง fallback state จาก URL parameters
        //   storedState = {
        //     state: state || '',
        //     nonce: 'fallback-nonce',
        //     redirectUri: process.env.NEXT_PUBLIC_OIDC_CALLBACK_URL || 'https://chat.rmutl.ac.th/oidc/callback'
        //   };
          
        //   // console.log('🔧 Created fallback state:', storedState);
          
        // } else {
        //   try {
        //     storedState = JSON.parse(storedStateJson);
        //     console.log('✅ Found stored state in sessionStorage');
        //   } catch (error) {
        //     console.error('❌ Failed to parse stored state, creating fallback:', error);
            
        //     // สร้าง fallback state เมื่อ JSON parse ล้มเหลว
        //     storedState = {
        //       state: state || '',
        //       nonce: 'fallback-nonce', 
        //       redirectUri: process.env.NEXT_PUBLIC_OIDC_CALLBACK_URL || 'https://chat.rmutl.ac.th/oidc/callback'
        //     };
            
        //     console.log('🔧 Created fallback state after parse error');
        //   }
        // }

        // setStatus('Processing authentication with backend...');
        // console.log('🔄 Starting OIDC backend authentication');
        
        // // Debug environment variables
        // debugOIDCEnvironment();
        
        // // เรียกใช้ formAction ผ่าน transition
        // console.log('🚀 Calling loginWithBackendAPI via formAction...');
        // setStatus('Authenticating with backend API...');
        
        // // แลกเปลี่ยน authorization code เป็น tokens
        // console.log('🔄 Exchanging authorization code for tokens...');
        // // const tokenData = await exchangeCodeForTokens(code, state, storedState);
        // const response = await fetch('/api/oidc-token', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ code, state }),
        // });
        // const tokenData = await response.json();
        // // console.log('✅ Token data received from exchangeCodeForTokens:', tokenData);
        
        // if (!tokenData) {
        //   console.error('❌ Token exchange failed');
        //   toast({
        //     type: 'error',
        //     description: 'Failed to exchange authorization code. Please try again.',
        //   });
        //   router.push('/login');
        //   return;
        // }

        // // ดึงข้อมูล user จาก access token
        // const userInfo = await getUserInfo(tokenData.access_token);
        // if (!userInfo) {
        //   console.error('❌ Failed to get user info');
        //   toast({
        //     type: 'error',
        //     description: 'Failed to retrieve user information. Please try again.',
        //   });
        //   router.push('/login');
        //   return;
        // }

        // console.log('✅ User info retrieved:', userInfo);
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
        const response = await fetch('/api/auth/oidc-callback', {
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
        
        // console.log('🔐 Prepared FormData for backend:');
        // console.log('   - Email: ', formData.get('email'));
        // console.log('   - Password: ', formData.get('password'));
        // console.log('   - OIDC Code: ', `${formData.get('oidc_code')?.toString().substring(0, 20)}...`);
        // console.log('   - OIDC State: ', formData.get('oidc_state'));
        // console.log('   - OIDC Session State: ', formData.get('oidc_session_state'));

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