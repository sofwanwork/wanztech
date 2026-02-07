import { getCertificateTemplates } from '@/lib/storage/certificates';
import { Button } from '@/components/ui/button';
import { Plus, FileImage } from 'lucide-react';
import Link from 'next/link';
import { CertificateTemplateCard } from '@/components/certificates/certificate-template-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { canCreateCertificate } from '@/lib/storage/subscription';
import { PricingModal } from '@/components/pricing-modal';
import { AlertTriangle } from 'lucide-react';
import { NewCertificateDialog } from '@/components/certificates/new-certificate-dialog';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'school', label: 'School' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'training', label: 'Training' },
  { id: 'event', label: 'Event' },
  { id: 'other', label: 'Other' },
];

export default async function CertificateBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; error?: string }>;
}) {
  const { category: categoryParam, error: errorParam } = await searchParams;
  const allTemplates = await getCertificateTemplates();
  const selectedCategory = categoryParam || 'all';
  const error = errorParam ? decodeURIComponent(errorParam) : null;

  const { allowed } = await canCreateCertificate();

  const templates = allTemplates.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
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
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Certificate
            </Button>
          </NewCertificateDialog>
        ) : (
          <PricingModal>
            <Button className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0">
              <Plus className="h-4 w-4" />
              Limit Reached
            </Button>
          </PricingModal>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={
              cat.id === 'all'
                ? '/certificates/builder'
                : `/certificates/builder?category=${cat.id}`
            }
          >
            <Badge
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer px-4 py-2 text-sm font-medium transition-all',
                selectedCategory === cat.id
                  ? 'shadow-md'
                  : 'hover:bg-gray-100 border-gray-300 text-gray-600'
              )}
            >
              {cat.label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100">
              <FileImage className="h-10 w-10 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              No {selectedCategory !== 'all' ? selectedCategory : ''} templates
            </h3>
            <p className="text-gray-500 mb-8 text-center text-sm max-w-sm">
              Start by creating your first certificate template.
            </p>
            {allowed ? (
              <NewCertificateDialog>
                <Button size="lg" className="shadow-xl shadow-primary/30">
                  Create Certificate Now
                </Button>
              </NewCertificateDialog>
            ) : (
              <PricingModal>
                <Button
                  size="lg"
                  className="shadow-xl shadow-amber-500/30 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0"
                >
                  Upgrade to Create More
                </Button>
              </PricingModal>
            )}
          </div>
        ) : (
          templates.map((template) => (
            <CertificateTemplateCard key={template.id} template={template} />
          ))
        )}
      </div>
    </div>
  );
}
