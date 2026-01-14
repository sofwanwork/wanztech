import { getFormByShortCode } from '@/lib/storage';
import { notFound } from 'next/navigation';
import { PublicFormClient } from '@/app/form/[id]/client'; // Import the client component
import type { Metadata } from 'next';

interface ShortLinkPageProps {
    params: Promise<{
        code: string;
    }>;
}

export async function generateMetadata({ params }: ShortLinkPageProps): Promise<Metadata> {
    const { code } = await params;
    const form = await getFormByShortCode(code);
    return {
        title: form?.title || 'Form',
        description: form?.description || 'Please fill out this form.',
    };
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
    const { code } = await params;

    if (!code) notFound();

    const form = await getFormByShortCode(code);

    if (!form) {
        notFound();
    }

    // Render the form directly instead of redirecting
    // This keeps the URL short in the browser
    return <PublicFormClient form={form} />;
}
