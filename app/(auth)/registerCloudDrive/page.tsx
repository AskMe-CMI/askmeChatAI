'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState, useRef } from 'react';
import { toast } from '@/components/toast';
import Form from 'next/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { registerWithBackendAPI, type RegisterActionState } from '../api-actions-clouddrive';

// Local implementation removed in favor of Server Action to avoid CORS issues

import { PDPAConsentModalAlt } from '@/components/pdpa-consent-modalA';

export default function RegisterAltPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);

    // Password validation helper
    const isPasswordValid = (pwd: string) => {
        return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);
    };

    const getPasswordValidationMessage = (pwd: string) => {
        if (pwd.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
        if (!/[A-Z]/.test(pwd)) return 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว';
        if (!/[a-z]/.test(pwd)) return 'รหัสผ่านต้องมีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว';
        if (!/[0-9]/.test(pwd)) return 'รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว';
        return '';
    };

    // Set custom validation messages
    useEffect(() => {
        if (passwordRef.current) {
            const message = password.length > 0 ? getPasswordValidationMessage(password) : '';
            passwordRef.current.setCustomValidity(message);
        }
    }, [password]);

    useEffect(() => {
        if (confirmPasswordRef.current) {
            const message = confirmPassword.length > 0 && confirmPassword !== password
                ? 'รหัสผ่านไม่ตรงกัน'
                : '';
            confirmPasswordRef.current.setCustomValidity(message);
        }
    }, [password, confirmPassword]);

    const [state, formAction] = useActionState<RegisterActionState, FormData>(
        registerWithBackendAPI,
        {
            status: 'idle',
        },
    );

    useEffect(() => {
        if (state.status === 'failed') {
            toast({
                type: 'error',
                description: state.message || 'Registration failed!',
            });
        } else if (state.status === 'invalid_data') {
            toast({
                type: 'error',
                description: state.message || 'Please check your input!',
            });
        } else if (state.status === 'success') {
            toast({
                type: 'success',
                description: state.message || 'Registration successful!',
            });
            router.push('/registerCloudDrive/success');
        }
    }, [state.status, state.message, router]);

    const handleSubmit = (formData: FormData) => {
        setEmail(formData.get('email') as string);
        formAction(formData);
    };

    return (
        <>
            <PDPAConsentModalAlt />
            <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
                <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-8">
                    <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
                        <h3 className="text-xl font-semibold dark:text-zinc-50">Register</h3>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                            Create your AskMe Cloud Drive account
                        </p>
                    </div>

                    <Form action={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
                        <div className="flex flex-col gap-2">
                            <Label
                                htmlFor="display_name"
                                className="text-zinc-600 font-normal dark:text-zinc-400"
                            >
                                Display Name
                            </Label>
                            <Input
                                id="display_name"
                                name="display_name"
                                className="bg-muted text-md md:text-sm"
                                type="text"
                                placeholder="John Doe"
                                autoComplete="name"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label
                                htmlFor="username"
                                className="text-zinc-600 font-normal dark:text-zinc-400"
                            >
                                Username
                            </Label>
                            <Input
                                id="username"
                                name="username"
                                className="bg-muted text-md md:text-sm"
                                type="text"
                                placeholder="johndoe"
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label
                                htmlFor="email"
                                className="text-zinc-600 font-normal dark:text-zinc-400"
                            >
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                className="bg-muted text-md md:text-sm"
                                type="email"
                                placeholder="user@example.com"
                                autoComplete="email"
                                required
                                defaultValue={email}
                            />
                        </div>

                        {/* Full Name field removed as user only asked for Username and API might not need it based on provided spec, keeping only requested Username */}

                        <div className="flex flex-col gap-2">
                            <Label
                                htmlFor="password"
                                className="text-zinc-600 font-normal dark:text-zinc-400"
                            >
                                Password
                            </Label>
                            <Input
                                ref={passwordRef}
                                id="password"
                                name="password"
                                className="bg-muted text-md md:text-sm"
                                type="password"
                                placeholder="Min 8 chars, upper, lower, number"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {/* Password Requirements Indicator */}
                            {password.length > 0 && (
                                <div className="text-xs space-y-1 mt-1">
                                    {/* Check if all requirements are met */}
                                    {password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) ? (
                                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                            <span>✓</span>
                                            <span>รหัสผ่านของคุณสมบูรณ์แล้ว</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                                <span>{password.length >= 8 ? '✓' : '✗'}</span>
                                                <span>อย่างน้อย 8 ตัวอักษร</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                                <span>{/[A-Z]/.test(password) ? '✓' : '✗'}</span>
                                                <span>มีตัวพิมพ์ใหญ่ (A-Z)</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                                <span>{/[a-z]/.test(password) ? '✓' : '✗'}</span>
                                                <span>มีตัวพิมพ์เล็ก (a-z)</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                                <span>{/[0-9]/.test(password) ? '✓' : '✗'}</span>
                                                <span>มีตัวเลข (0-9)</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label
                                htmlFor="confirmPassword"
                                className="text-zinc-600 font-normal dark:text-zinc-400"
                            >
                                Confirm Password
                            </Label>
                            <Input
                                ref={confirmPasswordRef}
                                id="confirmPassword"
                                name="confirmPassword"
                                className="bg-muted text-md md:text-sm"
                                type="password"
                                placeholder="Re-enter your password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <SubmitButton isSuccessful={state.status === 'success'}>
                            Register
                        </SubmitButton>

                    </Form>

                    <div className="flex flex-col gap-3 px-4 sm:px-16">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push('/logint')}
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            Login
                        </button>
                    </div>

                    <div className="px-4 sm:px-16 text-center">
                        <p className="text-xs text-gray-400">
                            Powered by Askme Solutions & Consultants Co.,Ltd.
                        </p>
                    </div>
                </div>
            </div>

        </>
    );
}
