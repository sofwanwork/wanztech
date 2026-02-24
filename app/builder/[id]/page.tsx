import { getFormById } from '@/lib/storage/forms';
import { getCertificateTemplates } from '@/lib/storage/certificates';
import { getSettings } from '@/lib/storage/settings';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { BuilderClient } from './client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BuilderPage({ params }: PageProps) {
  const { id } = await params;
  const [form, userCertificates, settings] = await Promise.all([
    getFormById(id),
    getCertificateTemplates(),
    getSettings(),
  ]);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!form) return notFound();

  // Security: Check if user owns the form
  if (!user || user.id !== form.userId) {
    return notFound();
  }

  // Show Google Sheet section if user has manual Service Account keys configured
  const useManualKeys = !!settings?.googleClientEmail;

  return <BuilderClient initialForm={form} userCertificates={userCertificates} useManualKeys={useManualKeys} />;
}
