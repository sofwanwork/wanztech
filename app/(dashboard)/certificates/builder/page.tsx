import { getCertificateTemplates } from '@/lib/storage/certificates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileImage, Copy } from 'lucide-react';
import Link from 'next/link';
import {
  createCertificateTemplateAction,
  cloneCertificateTemplateAction,
} from '@/actions/certificate-template';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { canCreateCertificate } from '@/lib/storage/subscription';
import { PricingModal } from '@/components/pricing-modal';
import { AlertTriangle } from 'lucide-react';

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
          <form action={createCertificateTemplateAction}>
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              New Certificate
            </Button>
          </form>
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
              <form action={createCertificateTemplateAction}>
                <Button type="submit" size="lg" className="shadow-xl shadow-primary/30">
                  Create Certificate Now
                </Button>
              </form>
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
            <Card
              key={template.id}
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl ring-1 ring-gray-100 hover:ring-primary/20 hover:-translate-y-1 p-0 gap-0 border-0"
            >
              {/* Thumbnail */}
              <Link href={`/certificates/builder/${template.id}`}>
                <div
                  className="aspect-[297/210] bg-gray-100 relative overflow-hidden cursor-pointer"
                  style={{ backgroundColor: template.backgroundColor }}
                >
                  {template.thumbnail ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileImage className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium">Edit</span>
                  </div>

                  {/* Category Badge (Overlay) */}
                  {template.category && (
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="secondary"
                        className="bg-white/90 text-xs font-semibold shadow-sm text-gray-800 backdrop-blur-sm"
                      >
                        {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                      </Badge>
                    </div>
                  )}
                </div>
              </Link>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(template.updatedAt).toLocaleDateString('ms-MY')}
                    </p>
                  </div>
                  <form action={cloneCertificateTemplateAction.bind(null, template.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      title="Clone template"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
