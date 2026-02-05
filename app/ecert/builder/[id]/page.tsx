import { getCertificateTemplate } from '@/lib/certificate-storage';
import { CertificateBuilderClient } from './client';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function CertificateBuilderEditorPage({ params }: PageProps) {
  const { id } = await params;
  const template = await getCertificateTemplate(id);

  if (!template) {
    notFound();
  }

  return <CertificateBuilderClient template={template} />;
}
