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
        <div className="flex h-screen w-full items-center justify-center bg-white text-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-60 z-0 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-3 p-6 rounded-lg border border-slate-200 bg-white shadow-2xs">
                <Loader2 className="h-7 w-7 animate-spin text-violet-900" />
                <p className="text-sm font-medium text-slate-600">{status}</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen w-full items-center justify-center bg-white text-slate-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-60 z-0 pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center gap-3 p-6 rounded-lg border border-slate-200 bg-white shadow-2xs">
                        <Loader2 className="h-7 w-7 animate-spin text-violet-900" />
                        <p className="text-sm font-medium text-slate-600">Loading...</p>
                    </div>
                </div>
            }
        >
            <AuthCallbackContent />
        </Suspense>
    );
}
