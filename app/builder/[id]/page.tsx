import { getFormById } from '@/lib/storage/forms';
import { getCertificateTemplates } from '@/lib/storage/certificates';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { BuilderClient } from './client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BuilderPage({ params }: PageProps) {
  const { id } = await params;
  const form = await getFormById(id);
  const userCertificates = await getCertificateTemplates();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!form) return notFound();

  // Security: Check if user owns the form
  if (!user || user.id !== form.userId) {
    return notFound();
  }

  return <BuilderClient initialForm={form} userCertificates={userCertificates} />;
}
