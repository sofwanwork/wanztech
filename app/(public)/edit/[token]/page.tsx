import { notFound } from 'next/navigation';
import { getEditToken } from '@/lib/storage/edit-tokens';
import { getFormById } from '@/lib/storage/forms';
import { unflattenGridResponses } from '@/lib/forms/grid';
import { PublicFormClient } from '../../form/[id]/client';
import { AlertCircle } from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ token: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Edit Response',
  robots: { index: false, follow: false },
};

export default async function EditResponsePage({ params }: PageProps) {
  const { token } = await params;

  const lookup = await getEditToken(token);
  if (!lookup.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white text-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-60 z-0 pointer-events-none" />
        <div className="relative z-10 max-w-md w-full bg-white rounded-lg shadow-2xs border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-md bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            Invalid Link
          </h1>
          <p className="text-sm text-slate-600">
            {lookup.reason === 'expired' &&
              'This link has expired. Please contact the organizer for a new link.'}
            {lookup.reason === 'used' &&
              'This link has already been used. Each link can only be used once.'}
            {lookup.reason === 'not_found' && 'This link does not exist or has been deleted.'}
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
    if (field.type === 'grid') {
      const gridAnswers = unflattenGridResponses(field, lookup.row.snapshot);
      if (Object.keys(gridAnswers).length > 0) {
        initialValues[field.id] = gridAnswers;
      }
      continue;
    }
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
