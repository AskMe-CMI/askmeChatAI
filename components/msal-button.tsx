'use client';

import { useFormStatus } from 'react-dom';
import { LoaderIcon } from '@/components/icons';
import { toast } from '@/components/toast';

import { Button } from './ui/button';

import React, { useActionState, useEffect, useState, useTransition } from 'react';
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { loginRequest } from '../lib/auth/auth-msal';
import { loginWithBackendAPI, type LoginActionState } from '@/app/(auth)/api-actions-ms';

type ApiResponse = {
  message?: string;
  error?: string;
} | null;

export function MsalButton({
  children,
  isSuccessful,
}: {
  children: React.ReactNode;
  isSuccessful: boolean;
}) {
  const { instance, accounts } = useMsal();
  const [apiResp, setApiResp] = useState<ApiResponse>(null);
  const [isPending, startTransition] = useTransition();
  // const [email, setEmail] = useState('');

  const[state, formAction] = useActionState<LoginActionState, FormData>(
    loginWithBackendAPI,
    {
      status: 'idle',
    },  
  );

  useEffect(() => {
    console.log('🔄 MSAL Button - Action State Changed:', state.status, state.message);
    
    if (state.status === 'failed') {
      console.error('❌ Login failed:', state.message);
      toast({
        type: 'error',
        description: state.message || 'Login failed!',
      });
    } else if (state.status === 'invalid_data') {
      console.error('⚠️ Invalid data:', state.message);
      toast({
        type: 'error',
        description: state.message || 'Please check your input!',
      });
    } else if (state.status === 'success') {
      console.log('✅ Login successful! Checking external state...');
      toast({
        type: 'success',
        description: 'Login successful!',
      });
      
      // เช็คข้างนอก component - ตรวจสอบสถานะต่างๆ
      checkExternalAuthState();
    }
  }, [state.status, state.message]);

  // ฟังก์ชั่นเช็คสถานะภายนอก component
  const checkExternalAuthState = async () => {
    try {
      console.log('🔍 Checking external authentication state...');
      
      // 1. เช็ค session storage หรือ local storage
      const sessionData = sessionStorage.getItem('user-session');
      console.log('📦 Session data:', sessionData);
      
      // 2. เช็ค cookies
      const cookies = document.cookie;
      console.log('🍪 Cookies:', cookies);
      
      // 3. เช็ค API endpoint เพื่อยืนยันสถานะ
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include', // ส่ง cookies
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ External auth verified:', userData);
        
        // 4. Redirect หรือ update UI ตามสถานะ
        // setTimeout(() => {
          window.location.href = '/';
        // }, 1000);
      } else {
        console.log('❌ External auth verification failed');
        toast({
          type: 'error',
          description: 'Authentication verification failed. Please try again.',
        });
      }
    } catch (error) {
      console.error('❌ Error checking external auth state:', error);
      // Fallback: redirect anyway
      // setTimeout(() => {
      //   window.location.href = '/';
      // }, 1000);
    }
  };
  
  const handleLogin = async () => {
    try {
      const res = await instance.loginPopup(loginRequest);
      const msEmail = res.account.username;
      console.log('🔐 Logged in user ms-email: ', msEmail);
      
      // สร้าง FormData ใหม่พร้อมกับ email จาก MS account
      const formData = new FormData();
      formData.set('email', msEmail);
      formData.set('password', 'msal-authenticated'); // ใช้ placeholder password สำหรับ MSAL
      
      // ตรวจสอบว่า FormData มี email หรือไม่
      console.log('📧 FormData email: ', formData.get('email'));
      console.log('📋 FormData keys: ', Array.from(formData.keys()));
      console.log('📄 FormData entries: ', Array.from(formData.entries()));
      
      // ตรวจสอบว่า FormData มี email
      console.log('🔍 FormData check:');
      console.log('   - Has email: ', formData.has('email'));
      console.log('   - Email value: ', formData.get('email'));
      console.log('   - Has password: ', formData.has('password'));
      
      // เรียกใช้ form action ภายใน transition
      // setEmail(formData.get('email') as string);
      startTransition(() => {
        formAction(formData);
      });
    } catch (e) {
      console.error('❌ MSAL Login Error:', e);
    }
  };

  // const handleLogout = async () => {
  //   try {
  //     await instance.logoutPopup();
  //   } catch (e) { console.error(e); }
  // };

  // const callEchoApi = async () => {
  //   try {
  //     const account = accounts?.[0];
  //     const response = await instance.acquireTokenSilent({ ...loginRequest, account });
  //     const res = await fetch('/api/echo', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${response.accessToken}`
  //       },
  //       body: JSON.stringify({ message: 'Hello from client' })
  //     });
  //     const data = await res.json();
  //     setApiResp(data);
  //   } catch (e) {
  //     console.error(e);
  //     setApiResp({ error: String(e) });
  //   }
  // };
  return (
    <div>
      <UnauthenticatedTemplate>
        <Button
          type={'button'}
          aria-disabled={isSuccessful || isPending}
          disabled={isSuccessful || isPending}
          className="relative w-full"
          onClick={handleLogin}
        >
          {children}

          {(isSuccessful || isPending) && (
            <span className="animate-spin absolute right-4">
              <LoaderIcon />
            </span>
          )}

          <output aria-live="polite" className="sr-only">
            {isSuccessful || isPending ? 'Loading' : 'Submit form'}
          </output>
        </Button>
      </UnauthenticatedTemplate>
      <AuthenticatedTemplate>
        <Button
          type={'button'}
          aria-disabled={true}
          disabled={true}
          className="relative w-full"
        >
          {children}

          <span className="animate-spin absolute right-4">
            <LoaderIcon />
          </span>

          <output aria-live="polite" className="sr-only">
            Loading
          </output>
        </Button>
        {/* <p>Signed in as: {accounts?.[0]?.username}</p>
        <Button onClick={callEchoApi}>Call API (echo) with access token</Button>
        <Button onClick={handleLogout} style={{ marginLeft: 8 }}>Sign out</Button>
        <pre style={{ marginTop: 12 }}>{JSON.stringify(apiResp, null, 2)}</pre> */}
      </AuthenticatedTemplate>
    </div>
  );
}
