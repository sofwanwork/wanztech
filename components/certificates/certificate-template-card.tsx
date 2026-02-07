'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { FileImage, Copy } from 'lucide-react';
import { cloneCertificateTemplateAction } from '@/actions/certificate-template';
import { DeleteCertificateButton } from '@/components/certificates/delete-certificate-button';
import type { CertificateTemplate } from '@/lib/types';

interface CertificateTemplateCardProps {
  template: CertificateTemplate;
}

export function CertificateTemplateCard({ template }: CertificateTemplateCardProps) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl ring-1 ring-gray-100 hover:ring-primary/20 hover:-translate-y-1 p-0 gap-0 border-0">
      {/* Thumbnail */}
      <Link href={`/certificates/builder/${template.id}`}>
        <div className="aspect-[297/210] relative overflow-hidden cursor-pointer template-card-bg">
          <style jsx>{`
            .template-card-bg {
              background-color: ${template.backgroundColor || '#ffffff'};
            }
          `}</style>
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
          <div className="flex items-center gap-1">
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
            <DeleteCertificateButton templateId={template.id} templateName={template.name} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
