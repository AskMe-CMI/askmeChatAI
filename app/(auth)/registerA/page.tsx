'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';
import Form from 'next/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';
import { registerWithBackendAPI, type RegisterActionState } from '../api-actions';

// Local implementation removed in favor of Server Action to avoid CORS issues

import { PDPAConsentModalAlt } from '@/components/pdpa-consent-modal-alt';

export default function RegisterAltPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');

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
            // Redirect to login after successful registration
            setTimeout(() => {
                router.push('/logint');
            }, 1500);
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
                            Create your AskMe Chat AI account
                        </p>
                    </div>

                    <Form action={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
                        <div className="flex flex-col gap-2">
                            <Label
                                htmlFor="fullName"
                                className="text-zinc-600 font-normal dark:text-zinc-400"
                            >
                                Full Name
                            </Label>
                            <Input
                                id="fullName"
                                name="fullName"
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
                                id="password"
                                name="password"
                                className="bg-muted text-md md:text-sm"
                                type="password"
                                placeholder="Minimum 6 characters"
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label
                                htmlFor="confirmPassword"
                                className="text-zinc-600 font-normal dark:text-zinc-400"
                            >
                                Confirm Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                className="bg-muted text-md md:text-sm"
                                type="password"
                                placeholder="Re-enter your password"
                                autoComplete="new-password"
                                required
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
