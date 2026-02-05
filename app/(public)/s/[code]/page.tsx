import { getFormByShortCode } from '@/lib/storage/forms';
import { notFound } from 'next/navigation';
import { PublicFormClient } from '@/app/(public)/form/[id]/client'; // Import the client component
import type { Metadata } from 'next';

interface ShortLinkPageProps {
  params: Promise<{
    code: string;
  }>;
}

export async function generateMetadata({ params }: ShortLinkPageProps): Promise<Metadata> {
  const { code } = await params;
  const form = await getFormByShortCode(code);

  if (!form) {
    return {
      title: 'Form Not Found',
    };
  }

  const title = form.title || 'Form';
  const description = form.description
    ? form.description.replace(/<[^>]*>/g, '').substring(0, 160)
    : 'Please fill out this form.';

  // Prepare OG Image
  let images: string[] = [];
  if (form.coverImage) {
    const match = form.coverImage.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (
      match &&
      match[1] &&
      (form.coverImage.includes('drive.google.com') || form.coverImage.includes('docs.google.com'))
    ) {
      images = [`https://lh3.googleusercontent.com/d/${match[1]}`];
    } else {
      images = [form.coverImage];
    }
  } else {
    // Fallback to default og image if needed (or app logo)
    // For now, let's leave it empty to use default from layout?
    // Layout doesn't have OG image.
    // Let's use a default if we have one, or just empty.
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  const { code } = await params;

  if (!code) notFound();

  const form = await getFormByShortCode(code);

  if (!form) {
    notFound();
  }

  // Render the form directly instead of redirecting
  // This keeps the URL short in the browser
  return <PublicFormClient form={form} />;
}
