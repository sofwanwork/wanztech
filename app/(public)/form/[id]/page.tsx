import { getFormByIdOrShortCode } from '@/lib/storage/forms';
import { notFound } from 'next/navigation';
import { PublicFormClient } from './client';
import { verifyRotatingQrToken } from '@/lib/forms/rotating-qr';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const form = await getFormByIdOrShortCode(id);

  if (!form) {
    return {
      title: 'Form Not Found',
    };
  }

  const title = (form.title || 'Form').replace(/\r?\n/g, ' ').trim();
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

export default async function PublicFormPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};
  const form = await getFormByIdOrShortCode(id);

  if (!form) return notFound();

  // Validate Live Rotating QR token if enabled
  const rotatingConfig = form.attendanceSettings?.rotatingQr;
  let rotatingQrVerification: { valid: boolean; reason?: string } | undefined = undefined;

  if (form.attendanceSettings?.enabled && rotatingConfig?.enabled) {
    const res = verifyRotatingQrToken({
      formId: form.id,
      windowIndex: typeof sParams.rq_w === 'string' ? sParams.rq_w : undefined,
      signature: typeof sParams.rq_sig === 'string' ? sParams.rq_sig : undefined,
      customSecret: rotatingConfig.secret,
      intervalSeconds: rotatingConfig.intervalSeconds,
    });
    rotatingQrVerification = {
      valid: res.valid,
      reason: res.reason,
    };
  }

  // Sanitize form data to avoid leaking sensitive fields to client
  const sanitizedForm = {
    ...form,
    googleSheetUrl: undefined, // Hidden from client
    userTier: undefined, // Internal use
  };

  return (
    <PublicFormClient
      form={sanitizedForm}
      searchParams={{
        rq_w: typeof sParams.rq_w === 'string' ? sParams.rq_w : undefined,
        rq_sig: typeof sParams.rq_sig === 'string' ? sParams.rq_sig : undefined,
      }}
      rotatingQrVerification={rotatingQrVerification}
    />
  );
}

