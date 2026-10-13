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
  const proto = headerList.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1');
  const appUrl = (isLocalHost || !process.env.NEXT_PUBLIC_APP_URL)
    ? `${proto}://${host}`
    : process.env.NEXT_PUBLIC_APP_URL;

  return (
    <>
      {/* Google Font Monofett for Linktree @fik2026 stencil typography preview */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Monofett&display=swap"
        rel="stylesheet"
      />
      <BioBuilderClient initialPage={page} forms={forms} appUrl={appUrl} />
    </>
  );
}
