'use client';

import { useEffect, useState, useActionState, useTransition, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/components/toast';
import { LoaderIcon } from '@/components/icons';
import { loginWithBackendAPI, type LoginActionState } from '@/app/(auth)/api-actions-oidc-mock';

interface GoogleAuthData {
    tokenData: {
        access_token: string | null;
        id_token: string | null;
        token_type: string;
        expires_in: number;
        scope: string;
        refresh_token: string | null;
    };
    userInfo: {
        sub: string;
        name: string;
        given_name: string;
        family_name: string;
        picture: string;
        email: string;
        email_verified: boolean;
        locale: string;
        error?: string;
    };
    raw_id_token_claims: any;
}

import { Suspense } from 'react';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [authData, setAuthData] = useState<GoogleAuthData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Processing authentication...');
    const [isProcessing, setIsProcessing] = useState(true);

    const [state, formAction] = useActionState<LoginActionState, FormData>(
        loginWithBackendAPI,
        { status: 'idle' },
    );
    const [isPending, startTransition] = useTransition();

    const processedRef = useRef(false);

    useEffect(() => {
        // Check for error from callback
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(decodeURIComponent(errorParam));
            setIsProcessing(false);
            return;
        }

        // Check for success - read data from cookie
        const success = searchParams.get('success');
        if (success === 'true') {
            const cookieData = getCookie('google_auth_data');
            if (cookieData) {
                try {
                    const decoded = JSON.parse(base64DecodeUtf8(cookieData));
                    setAuthData(decoded);
                } catch (e) {
                    setError('Failed to parse auth data from cookie');
                    setIsProcessing(false);
                }
            }
        }
    }, [searchParams]);

    // Handle the backend API login
    useEffect(() => {
        if (!authData || !authData.userInfo || !authData.userInfo.email || processedRef.current) return;

        const processBackendLogin = async () => {
            processedRef.current = true;
            try {
                const formData = new FormData();
                formData.set('email', authData.userInfo.email);
                formData.set('password', 'oidc-authenticated');

                // Set Google code and state if present in url
                formData.set('oidc_code', searchParams.get('code') || 'google-auth');
                formData.set('oidc_state', searchParams.get('state') || 'google-state');

                startTransition(() => {
                    formAction(formData);
                });
            } catch (err) {
                console.error('❌ Callback processing error:', err);
                toast({
                    type: 'error',
                    description: 'Authentication failed. Please try again.',
                });
                router.push('/login');
            }
        };

        processBackendLogin();
    }, [authData, formAction, startTransition, router, searchParams]);

    // Listen to formAction state changes
    useEffect(() => {
        if (state.status === 'success') {
            console.log('✅ Login successful, redirecting...');
            setStatus('Authentication successful! Redirecting...');
            toast({
                type: 'success',
                description: 'Authentication successful! Welcome to AskMe Chat AI.',
            });

            // Clear google Auth cookie like OIDC did
            document.cookie = 'google_auth_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

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

            document.cookie = 'google_auth_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

            try {
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

    // Update status based on pending
    useEffect(() => {
        if (isPending) {
            setStatus('Authenticating with backend...');
            setIsProcessing(true);
        } else if (state.status === 'success' || state.status === 'registered_success' || state.status === 'failed') {
            setIsProcessing(false);
        }
    }, [isPending, state.status]);

    const handleLogout = () => {
        document.cookie = 'google_auth_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        setAuthData(null);
        setError(null);
        window.location.href = '/login';
    };

    return (
        <div className="flex h-dvh w-screen items-center justify-center bg-background">
            <div className="w-full max-w-md flex flex-col items-center gap-6 p-8">
                {/* Error Display */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive rounded-lg p-4 w-full text-center">
                        <h3 className="text-destructive font-semibold mb-2">❌ Error</h3>
                        <p className="text-sm text-destructive break-all">{error}</p>
                        <button
                            onClick={handleLogout}
                            className="mt-4 px-4 py-2 border border-destructive rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm"
                        >
                            Back to Login
                        </button>
                    </div>
                )}

                {!error && (
                    <>
                        <div className="flex items-center gap-3">
                            {isProcessing && <LoaderIcon size={24} />}
                            <h2 className="text-xl font-semibold dark:text-zinc-50">
                                Authenticating with Google...
                            </h2>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                                {status}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                Processing your Google authentication
                            </p>

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
                            {authData?.userInfo?.email && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Logged in as: {authData.userInfo.email}
                                </p>
                            )}
                            <div className="text-xs text-gray-500 mt-2">
                                <p>FormAction Status: {state.status}</p>
                                <p>Is Pending: {isPending ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function LoginGooglePage() {
    return (
        <Suspense fallback={
            <div className="flex h-dvh w-screen items-center justify-center bg-background">
                <p>Loading...</p>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function base64DecodeUtf8(base64: string): string {
    const binaryString = atob(base64);
    const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
}
