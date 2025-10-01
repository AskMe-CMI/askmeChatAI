'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from '@/components/toast';
import { Button } from '@/components/ui/button';
import { LoaderIcon } from '@/components/icons';

// import { createAuthorizationUrl, parseOIDCError, type OIDCAuthState } from '@/lib/auth/oidc-provider';
import { config } from 'dotenv';
config();
// const fetchOIDCConfig = async () => {
//   try {
//     const res = await fetch('/api/auth/envCheck', {
//       method: 'GET',
//       headers: { 'Content-Type': 'application/json' },
//     });
//     const data = await res.json();
//     console.log('🔧 OIDC Config:', data);
//   } catch (error) {
//     console.error('Error fetching OIDC config:', error);
//   }
// };
// fetchOIDCConfig();

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  // ตรวจสอบ environment variables เมื่อ component โหลด
  // ตรวจสอบ URL parameters สำหรับ OIDC response
  // useEffect(() => {
  //   const urlParams = new URLSearchParams(window.location.search);
    
  //   // ตรวจสอบว่ามี error จาก OIDC provider หรือไม่
  //   const oidcError = parseOIDCError(urlParams);
  //   if (oidcError) {
  //     console.error('OIDC Error:', oidcError);
  //     toast({
  //       type: 'error',
  //       description: oidcError.error_description || `Authentication error: ${oidcError.error}`,
  //     });
  //     return;
  //   }

  //   // ถ้ามี code และ state แสดงว่ากลับมาจาก callback
  //   const code = urlParams.get('code');
  //   const state = urlParams.get('state');
    
  //   if (code && state) {
  //     // Redirect ไป callback page เพื่อจัดการ tokens
  //     router.push(`/oidc/callback?code=${code}&state=${state}`);
  //   }
  // }, [router]);

  const handleOIDCLogin = async () => {
    setIsLoading(true);
    
    try {
      // call api/oidc-auth-url to get authorization URL
      const response = await fetch('/api/auth/oidc-auth-url');
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
      console.log('💾 State saved to sessionStorage');
      
      // เก็บ state ใน localStorage เป็น backup
      localStorage.setItem('oidc_state_backup', JSON.stringify(state));
      console.log('💾 State backup saved to localStorage');
      
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
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In with OIDC</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your Microsoft account to RMUTL Chat AI
          </p>
        </div>
        
        <div className="flex flex-col px-4 sm:px-16">
          <Button
            onClick={handleOIDCLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <LoaderIcon size={16} />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="1rem" height="1rem" viewBox="0 0 256 256">
                <path fill="#F1511B" d="M121.666 121.666H0V0h121.666z"/>
                <path fill="#80CC28" d="M256 121.666H134.335V0H256z"/>
                <path fill="#00ADEF" d="M121.663 256.002H0V134.336h121.663z"/>
                <path fill="#FBBC09" d="M256 256.002H134.335V134.336H256z"/>
              </svg>
            )}
            {isLoading ? 'Redirecting...' : 'Sign in with Microsoft (OIDC)'}
          </Button>
        </div>
        
        <div className="px-4 sm:px-16 text-center">
          <p className="text-xs text-gray-400">
            Powered by ARIT RMUTL
          </p>
        </div>
      </div>
    </div>
  );
}
