
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

    if (!form) {
        return {
            title: 'Form Not Found',
        };
    }

    const title = form.title || 'Form';
    const description = form.description ? form.description.replace(/<[^>]*>/g, '').substring(0, 160) : 'Please fill out this form.';

    // Prepare OG Image
    let images: string[] = [];
    if (form.coverImage) {
        const match = form.coverImage.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1] && (form.coverImage.includes('drive.google.com') || form.coverImage.includes('docs.google.com'))) {
            images = [`https://lh3.googleusercontent.com/d/${match[1]}`];
        } else {
            images = [form.coverImage];
        }
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    };
}

export default async function PublicFormPage({ params }: PageProps) {
    const { id } = await params;
    const form = await getFormById(id);

    if (!form) return notFound();

    return <PublicFormClient form={form} />;
}
