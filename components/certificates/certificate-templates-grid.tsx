'use client';

import { useMemo, useState } from 'react';
import { FileImage, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CertificateTemplateCard } from '@/components/certificates/certificate-template-card';
import { NewCertificateDialog } from '@/components/certificates/new-certificate-dialog';
import { PricingModal } from '@/components/pricing-modal';
import type { CertificateTemplate } from '@/lib/types';

interface CertificateTemplatesGridProps {
  templates: CertificateTemplate[];
  allowed: boolean;
}

export function CertificateTemplatesGrid({
  templates,
  allowed,
}: CertificateTemplatesGridProps) {
  const [query, setQuery] = useState('');

  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return templates;
    return templates.filter((t) => t.name.toLowerCase().includes(normalized));
  }, [templates, query]);

  return (
    <div className="space-y-6">
      {templates.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search certificates..."
              aria-label="Search certificates"
              className="pl-9 pr-8 h-10 bg-white rounded-md border-slate-200"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {query.trim()
              ? `Showing ${filteredTemplates.length} of ${templates.length} templates`
              : `${templates.length} ${templates.length === 1 ? 'template' : 'templates'}`}
          </p>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center mb-5 shadow-2xs border border-slate-200">
            <FileImage className="h-10 w-10 text-primary/60" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">No certificate templates yet</h3>
          <p className="text-gray-500 mb-8 text-center text-sm max-w-sm">
            Start by creating your first certificate template.
          </p>
          {allowed ? (
            <NewCertificateDialog>
              <Button
                size="lg"
                className="bg-violet-900 hover:bg-violet-950 text-white rounded-md shadow-xs"
              >
                Create Certificate Now
              </Button>
            </NewCertificateDialog>
          ) : (
            <PricingModal>
              <Button
                size="lg"
                className="bg-violet-900 hover:bg-violet-950 text-white rounded-md shadow-xs"
              >
                Upgrade to Create More
              </Button>
            </PricingModal>
          )}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <p className="text-sm font-medium text-slate-900">
            No certificates match &ldquo;{query.trim()}&rdquo;
          </p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Try searching with a different template name.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuery('')}
            className="rounded-md border-slate-200"
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <CertificateTemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
