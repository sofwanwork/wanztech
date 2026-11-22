import { getCertificateTemplates } from '@/lib/storage/certificates';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';
import { canCreateCertificate } from '@/lib/storage/subscription';
import { PricingModal } from '@/components/pricing-modal';
import { NewCertificateDialog } from '@/components/certificates/new-certificate-dialog';
import { CertificateTemplatesGrid } from '@/components/certificates/certificate-templates-grid';

export const dynamic = 'force-dynamic';

export default async function CertificateBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;
  const templates = await getCertificateTemplates();
  const error = errorParam ? decodeURIComponent(errorParam) : null;
  const { allowed } = await canCreateCertificate();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">E-Cert Builder</h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            Create and edit your own certificate templates.
          </p>
        </div>

        {allowed ? (
          <NewCertificateDialog>
            <Button className="gap-2 bg-violet-900 hover:bg-violet-950 text-white rounded-md shadow-xs">
              <Plus className="h-4 w-4" />
              New Certificate
            </Button>
          </NewCertificateDialog>
        ) : (
          <PricingModal>
            <Button className="gap-2 bg-violet-900 hover:bg-violet-950 text-white rounded-md shadow-xs">
              <Plus className="h-4 w-4" />
              Limit Reached
            </Button>
          </PricingModal>
        )}
      </div>

      {/* Search & Templates Grid */}
      <CertificateTemplatesGrid templates={templates} allowed={allowed} />
    </div>
  );
}
