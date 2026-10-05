import { getFormByIdOrShortCode } from '@/lib/storage/forms';
import { notFound } from 'next/navigation';
import { PresenterClient } from './client';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const form = await getFormByIdOrShortCode(id);

  if (!form) {
    return {
      title: 'Attendance Screen Not Found',
    };
  }

  const title = (form.title || 'Attendance Screen').replace(/\r?\n/g, ' ').trim();
  return {
    title: `Attendance Projector — ${title}`,
    robots: { index: false, follow: false },
  };
}

export default async function PresenterPage({ params }: PageProps) {
  const { id } = await params;
  const form = await getFormByIdOrShortCode(id);

  if (!form) return notFound();

  return (
    <PresenterClient
      formId={form.id}
      formTitle={form.title}
      isRotatingEnabled={!!form.attendanceSettings?.rotatingQr?.enabled}
      intervalSeconds={form.attendanceSettings?.rotatingQr?.intervalSeconds || 30}
      checkOutPasscode={form.attendanceSettings?.checkInOut?.checkOutPasscode}
    />
  );
}
