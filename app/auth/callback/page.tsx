'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Processing authentication...');

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const tokenHash = searchParams.get('token_hash');
            const type = searchParams.get('type');
            const next = searchParams.get('next') ?? '/';
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');
            const errorCode = searchParams.get('error_code');

            // Also check hash fragment for errors (Supabase sometimes puts errors there)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const hashError = hashParams.get('error');
            const hashErrorDescription = hashParams.get('error_description');

            // Handle errors from Supabase (e.g. expired link)
            if (error || errorCode || hashError) {
                const message = errorDescription || hashErrorDescription || error || hashError || 'Authentication failed';
                router.replace(`/login?error=${encodeURIComponent(message)}`);
                return;
            }

            const supabase = createClient();

            // Handle code exchange flow (PKCE - signup verification, OAuth, password reset)
            if (code) {
                setStatus('Exchanging code for session...');
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (!exchangeError) {
                    router.replace(next);
                    return;
                } else {
                    console.error('Auth Code Exchange Error:', exchangeError);
                    router.replace(`/login?error=${encodeURIComponent(exchangeError.message)}`);
                    return;
                }
            }

            // Handle token_hash flow (password recovery, email verification via token)
            if (tokenHash && type) {
                setStatus('Verifying token...');
                const { error: otpError } = await supabase.auth.verifyOtp({
                    token_hash: tokenHash,
                    type: type as 'recovery' | 'email',
                });
                if (!otpError) {
                    router.replace(next);
                    return;
                } else {
                    console.error('Auth OTP Verification Error:', otpError);
                    router.replace(`/login?error=${encodeURIComponent(otpError.message)}`);
                    return;
                }
            }

            // No code or token_hash provided
            router.replace('/login?error=NoCodeProvided');
        };

        handleCallback();
    }, [router, searchParams]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-gray-500">{status}</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                </div>
            }
        >
            <AuthCallbackContent />
        </Suspense>
    );
}
