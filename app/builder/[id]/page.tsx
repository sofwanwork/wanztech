import { getFormById } from '@/lib/storage/forms';
import { getCertificateTemplates } from '@/lib/storage/certificates';
import { notFound } from 'next/navigation';
import { BuilderClient } from './client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BuilderPage({ params }: PageProps) {
  const { id } = await params;
  const form = await getFormById(id);
  const userCertificates = await getCertificateTemplates();

  if (!form) return notFound();

  return <BuilderClient initialForm={form} userCertificates={userCertificates} />;
}
