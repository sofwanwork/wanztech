import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getBioPageById } from '@/lib/storage/bio-links';
import { getFormsSummary } from '@/lib/storage/forms';
import { BioBuilderClient } from './client';

export const dynamic = 'force-dynamic';

interface BioBuilderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: BioBuilderPageProps) {
  const params = await props.params;
  const page = await getBioPageById(params.id);
  if (!page) {
    return { title: 'Bio Builder | KlikForm' };
  }
  return {
    title: `Edit @${page.username} | Bio Builder | KlikForm`,
    description: `Customize links, theme, and profile for @${page.username}`,
  };
}

export default async function BioBuilderPage(props: BioBuilderPageProps) {
  const params = await props.params;
  const page = await getBioPageById(params.id);

  if (!page) {
    notFound();
  }

  // Load user forms for convenient form-linking
  const forms = await getFormsSummary();

  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  return <BioBuilderClient initialPage={page} forms={forms} appUrl={appUrl} />;
}
