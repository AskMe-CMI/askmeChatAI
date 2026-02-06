'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { verifyEmailAction } from '../api-actions';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('เราได้ส่งรหัสยืนยันไปยังอีเมลของคุณเรียบร้อยแล้ว หากคุณยังไม่ได้รับทันที กรุณารอประมาณ 5 วินาที ก่อนที่จะกดส่งรหัสใหม่อีกครั้ง เพื่อป้องกันการส่งข้อมูลซ้ำซ้อน');
  const verifyCalled = useRef(false);

  useEffect(() => {
    if (verifyCalled.current) return;
    verifyCalled.current = true;

    const verify = async () => {
      // 1. Capture start time
      const startTime = Date.now();
      const MIN_DELAY = 5000;

      let result: { success: boolean; message?: string };

      // 2. Perform verification (or check token)
      if (!token) {
        console.log('Verify email token: Missing');
        result = { success: false, message: 'Invalid verification link. Token is missing.' };
      } else {
        console.log('Verify email token:', token);
        try {
          result = await verifyEmailAction(token);
        } catch (error) {
           result = { success: false, message: 'An unexpected error occurred.' };
        }
      }

      // 3. Force wait for remaining time
      const elapsed = Date.now() - startTime;
      const remaining = MIN_DELAY - elapsed;
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      // 4. Update state
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Email verified successfully!');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Verification failed.');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' ? 'รหัสยืนยันของคุณถูกส่งออกไปแล้ว' : (status === 'success' ? 'Email Verified' : 'Email Verification')}
          </CardTitle>
          <CardDescription>
            {status === 'loading' ? 'กรุณารอสักครู่...' : 'Confirming your registration'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground text-center text-sm px-4">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={60} className="text-[#0fa2b1] dark:text-[#0fa2b1]" />
              <div className="text-center space-y-2">
                <p className="font-medium text-lg text-foreground">{message}</p>
                <p className="text-sm text-muted-foreground">Redirecting to login page...</p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-destructive font-medium">{message}</p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status !== 'loading' && (
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full sm:w-auto min-w-[120px]"
              disabled={status === 'error'}
            >
              Go to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
