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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to verification page...</p>
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
