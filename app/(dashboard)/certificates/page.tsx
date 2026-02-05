import { getForms } from '@/lib/storage/forms';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';
import Link from 'next/link';
import { getCertificateTemplates } from '@/lib/storage/certificates';
import { CertificateQrCard } from '@/components/certificate-qr-card';

export default async function EcertDashboard() {
  const forms = await getForms();
  const userTemplates = await getCertificateTemplates();

  // Filter forms with e-certificate enabled
  const certificateForms = forms.filter((f) => f.eCertificateEnabled);

  // Helper to get friendly template name
  const getTemplateName = (templateId?: string) => {
    if (!templateId) return 'Default';

    // Check if it's a custom template ID
    const customTemplate = userTemplates.find((t) => t.id === templateId);
    if (customTemplate) return customTemplate.name;

    // Otherwise assume it's a legacy preset string (e.g. 'nature', 'classic')
    // Capitalize first letter
    return templateId.charAt(0).toUpperCase() + templateId.slice(1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Award className="h-8 w-8 text-primary" />
          E-Cert Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Forms with active e-certificate</p>
      </div>

      {certificateForms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active E-Cert</h3>
            <p className="text-gray-500 mb-4">
              Enable e-certificate in form builder to start using the e-cert system
            </p>
            <Link href="/">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certificateForms.map((form) => (
            <CertificateQrCard
              key={form.id}
              formId={form.id}
              formTitle={form.title}
              templateName={getTemplateName(form.eCertificateTemplate)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
