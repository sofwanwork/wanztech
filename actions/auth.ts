'use server'

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
}

export async function resetPasswordAction(email: string) {
    const supabase = await createClient();

    // Construct the callback URL
    // We can't use location.origin on the server, ensuring we use the correct headers or environment variable if set.
    // For now, we'll try to rely on headers or standard relative path if possible, 
    // BUT Supabase requires an absolute URL for redirectTo.

    // In server actions, we need to know the origin. 
    // Since we are not passing it in, we'll use process.env.NEXT_PUBLIC_APP_URL or fallback.
    // However, usually headers().get('origin') works.

    const headers = await import('next/headers');
    const origin = (await headers.headers()).get('origin') || 'http://localhost:3000'; // Fallback for dev

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}
