import { VerifyClient } from './client';
import { getFormById } from '@/lib/storage/forms';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyPage({ params }: PageProps) {
  const { id } = await params;

  // Try to find the certificate by ID
  // For now, we'll parse the ID to get formId and rowIndex
  // Format: {formId}-{rowIndex} or just use formId for general verification

  // First, check if this is a direct form ID (legacy support)
  const form = await getFormById(id);

  if (form && form.eCertificateEnabled) {
    // Redirect to the IC check page for this form
    return (
      <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-60 z-0 pointer-events-none" />
        <div className="relative z-10 text-center p-6 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <div className="animate-spin h-7 w-7 border-4 border-violet-900 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Redirecting to verification page...</p>
          <meta httpEquiv="refresh" content={`0;url=/check/${id}`} />
        </div>
      </div>
    );
  }

  // If not a form ID, try to find a specific certificate submission
  // For now, show a generic verification result
  // TODO: Implement certificate_submissions table for direct ID lookup

  return (
    <VerifyClient
      certificateId={id}
      formData={
        form
          ? {
              id: form.id,
              title: form.title,
              templateId: form.eCertificateTemplate,
            }
          : null
      }
    />
  );
}
