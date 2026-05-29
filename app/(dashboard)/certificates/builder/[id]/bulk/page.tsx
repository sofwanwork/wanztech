import { getCertificateTemplate } from '@/lib/storage/certificates';
import { notFound } from 'next/navigation';
import { BulkGenerateClient } from './client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function BulkGeneratePage({ params }: PageProps) {
  const { id } = await params;
  const template = await getCertificateTemplate(id);
  if (!template) notFound();
  return <BulkGenerateClient template={template} />;
}
