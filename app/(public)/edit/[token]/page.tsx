import { notFound } from 'next/navigation';
import { getEditToken } from '@/lib/storage/edit-tokens';
import { getFormById } from '@/lib/storage/forms';
import { PublicFormClient } from '../../form/[id]/client';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ token: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sunting Jawapan',
  robots: { index: false, follow: false },
};

export default async function EditResponsePage({ params }: PageProps) {
  const { token } = await params;

  const lookup = await getEditToken(token);
  if (!lookup.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8 text-center space-y-3">
          <div className="text-5xl">⛔</div>
          <h1 className="text-xl font-semibold text-gray-900">
            Pautan tidak sah
          </h1>
          <p className="text-sm text-gray-600">
            {lookup.reason === 'expired' &&
              'Pautan ini telah luput. Sila hubungi penganjur untuk pautan baru.'}
            {lookup.reason === 'used' &&
              'Pautan ini telah digunakan. Setiap pautan hanya boleh digunakan sekali.'}
            {lookup.reason === 'not_found' && 'Pautan ini tidak wujud atau telah dipadam.'}
          </p>
        </div>
      </div>
    );
  }

  const form = await getFormById(lookup.row.formId);
  if (!form) return notFound();

  // Snapshot is keyed by field label (matches Sheets shape). Re-key to
  // field id so PublicFormClient prefills correctly.
  const initialValues: Record<string, unknown> = {};
  for (const field of form.fields) {
    const v = lookup.row.snapshot[field.label];
    if (v !== undefined && v !== null && v !== '') {
      initialValues[field.id] = v;
    }
  }

  const sanitizedForm = {
    ...form,
    googleSheetUrl: undefined,
    userTier: undefined,
  };

  return (
    <PublicFormClient
      form={sanitizedForm}
      editMode={{ token }}
      initialValues={initialValues}
    />
  );
}
