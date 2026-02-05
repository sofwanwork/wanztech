import { notFound } from 'next/navigation';
import { getFormForCertificateCheck } from '@/actions/certificates';
import { CertificateCheckClient } from './client';
import { getCertificateTemplatePublic } from '@/lib/storage/certificates';

interface PageProps {
  params: Promise<{ formId: string }>;
}

export default async function CertificateCheckPage({ params }: PageProps) {
  const { formId } = await params;

  const form = await getFormForCertificateCheck(formId);

  if (!form || !form.eCertificateEnabled) {
    notFound();
  }

  // Attempt to fetch custom template if the ID looks like it might be one (or just try anyway)
  let customTemplateData = null;
  if (form.eCertificateTemplate) {
    customTemplateData = await getCertificateTemplatePublic(form.eCertificateTemplate);
  }

  return (
    <CertificateCheckClient
      formId={form.id}
      formTitle={form.title}
      templateId={form.eCertificateTemplate}
      customTemplateData={customTemplateData}
    />
  );
}
