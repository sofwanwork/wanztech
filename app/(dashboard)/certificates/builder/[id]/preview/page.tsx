import { getCertificateTemplate } from '@/lib/storage/certificates';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

const PLACEHOLDER_LABELS: Record<string, string> = {
  name: 'Ahmad Bin Abu',
  program: 'Program Latihan Kepimpinan',
  date: new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }),
  signature: 'Tandatangan',
};

export default async function CertificatePreviewPage({ params }: PageProps) {
  const { id } = await params;
  const template = await getCertificateTemplate(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/ecert/builder/${id}`}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-white font-semibold">Preview: {template.name}</h1>
        </div>
      </div>

      {/* Certificate Preview */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          id="certificate-preview"
          className="relative shadow-2xl"
          style={{
            width: `${template.width}px`,
            height: `${template.height}px`,
            backgroundColor: template.backgroundColor,
            backgroundImage: template.backgroundImage
              ? `url(${template.backgroundImage})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {template.elements.map((el) => (
            <div
              key={el.id}
              className="absolute"
              style={{
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {el.type === 'text' && (
                <div
                  style={{
                    fontSize: `${el.fontSize || 16}px`,
                    fontFamily: el.fontFamily,
                    fontWeight: el.fontWeight,
                    fontStyle: el.fontStyle,
                    color: el.color,
                    textAlign: el.textAlign,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {el.content}
                </div>
              )}
              {el.type === 'placeholder' && (
                <div
                  style={{
                    fontSize: `${el.fontSize || 16}px`,
                    fontFamily: el.fontFamily,
                    fontWeight: el.fontWeight,
                    fontStyle: el.fontStyle,
                    color: el.color,
                    textAlign: el.textAlign,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {PLACEHOLDER_LABELS[el.placeholderType || 'name']}
                </div>
              )}
              {el.type === 'shape' && (
                <div
                  style={{
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    backgroundColor: el.fill,
                    borderRadius: el.shapeType === 'circle' ? '50%' : 0,
                  }}
                />
              )}
              {el.type === 'image' && el.src && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={el.src} alt="" className="w-full h-auto" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
