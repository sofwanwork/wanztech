import { notFound } from 'next/navigation';
import { getFormForCertificateCheck } from '@/actions/certificates';
import { CertificateCheckClient } from './client';
import { getCertificateTemplatePublic } from '@/lib/storage/certificates';
import { collectTemplateIds } from '@/lib/certificates/category';
import type { CertificateTemplate, CertificateCategoryConfig } from '@/lib/types';

interface PageProps {
  params: Promise<{ formId: string }>;
}

export default async function CertificateCheckPage({ params }: PageProps) {
  const { formId } = await params;

  const form = await getFormForCertificateCheck(formId);

  if (!form || !form.eCertificateEnabled) {
    notFound();
  }

  const categoryConfig = (form.eCertificateCategory as CertificateCategoryConfig | null) ?? null;

  // Prefetch every template that might be rendered: the default plus each
  // template mapped to a category. Keyed by id so the client can pick the
  // right one after it learns the respondent's category.
  const ids = collectTemplateIds(categoryConfig ?? undefined, form.eCertificateTemplate);
  const templatesById: Record<string, CertificateTemplate> = {};
  await Promise.all(
    ids.map(async (id) => {
      const tpl = await getCertificateTemplatePublic(id);
      if (tpl) templatesById[id] = tpl;
    })
  );

  const defaultTemplateData = form.eCertificateTemplate
    ? templatesById[form.eCertificateTemplate] ?? null
    : null;

  return (
    <CertificateCheckClient
      formId={form.id}
      formTitle={form.title}
      templateId={form.eCertificateTemplate}
      customTemplateData={defaultTemplateData}
      categoryConfig={categoryConfig}
      templatesById={templatesById}
    />
  );
}
