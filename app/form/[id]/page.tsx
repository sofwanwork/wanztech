
import { getFormById } from '@/lib/storage';
import { notFound } from 'next/navigation';
import { PublicFormClient } from './client';
import type { Metadata } from 'next';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const form = await getFormById(id);
    return {
        title: form?.title || 'Form',
        description: form?.description || 'Please fill out this form.',
    };
}

export default async function PublicFormPage({ params }: PageProps) {
    const { id } = await params;
    const form = await getFormById(id);

    if (!form) return notFound();

    return <PublicFormClient form={form} />;
}
