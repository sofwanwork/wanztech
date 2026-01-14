
import { getFormById } from '@/lib/storage';
import { notFound } from 'next/navigation';
import { BuilderClient } from './client';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BuilderPage({ params }: PageProps) {
    const { id } = await params;
    const form = await getFormById(id);

    if (!form) return notFound();

    return <BuilderClient initialForm={form} />;
}
