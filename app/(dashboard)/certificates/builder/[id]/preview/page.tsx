import { getCertificateTemplate } from '@/lib/storage/certificates';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Star,
  Award,
  Shield,
  Heart,
  Trophy,
  Medal,
  ThumbsUp,
  MapPin,
  CheckCircle,
  Flag,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

const PLACEHOLDER_LABELS: Record<string, string> = {
  name: 'AHMAD BIN ABU',
  program: 'Program Latihan Kepimpinan',
  date: new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }),
  signature: 'Tandatangan',
  ic: '901234-56-7890',
  serial: 'CERT-001',
  expiry: new Date(Date.now() + 365 * 86400000).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }),
};

const ICON_MAP: Record<string, React.ElementType> = {
  Star,
  Award,
  Shield,
  Heart,
  Trophy,
  Medal,
  ThumbsUp,
  MapPin,
  CheckCircle,
  Flag,
};

export default async function CertificatePreviewPage({ params }: PageProps) {
  const { id } = await params;
  const template = await getCertificateTemplate(id);

  if (!template) {
    notFound();
  }

  // Replicate the scaling math used in the builder
  const previewScale = (template.width >= template.height ? 800 : 500) / template.width;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/certificates/builder/${id}`}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-white font-semibold">Preview: {template.name}</h1>
        </div>
      </div>

      {/* Certificate Preview */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div
          id="certificate-preview"
          className={`relative shadow-2xl w-full ${template.width >= template.height ? 'max-w-[800px]' : 'max-w-[500px]'
            }`}
          style={{
            aspectRatio: `${template.width}/${template.height}`,
            backgroundColor: template.backgroundColor,
            backgroundImage: template.backgroundImage
              ? `url(${template.backgroundImage})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {template.elements.map((el) => {
            return (
              <div
                key={el.id}
                className="absolute"
                style={{
                  left: `${(el.x / template.width) * 100}%`,
                  top: `${(el.y / template.height) * 100}%`,
                  width:
                    el.type === 'text' || el.type === 'placeholder'
                      ? 'auto'
                      : `${(el.width / template.width) * 100}%`,
                  height: el.type === 'text' || el.type === 'placeholder'
                    ? 'auto'
                    : `${(el.height / template.height) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${el.rotation ?? 0}deg)`,
                  opacity: el.opacity ?? 1,
                  boxShadow: el.shadow?.enabled
                    ? `${el.shadow.offsetX}px ${el.shadow.offsetY}px ${el.shadow.blur}px ${el.shadow.color}`
                    : undefined,
                  borderRadius: `${el.borderRadius ?? 0}px`,
                }}
              >
                {/* Text */}
                {el.type === 'text' && (
                  <div
                    className="whitespace-nowrap"
                    style={{
                      fontSize: `${(el.fontSize || 16) * previewScale}px`,
                      fontFamily: el.fontFamily,
                      fontWeight: el.fontWeight,
                      fontStyle: el.fontStyle,
                      textDecoration: el.textDecoration,
                      color: el.color,
                      textAlign: el.textAlign,
                      lineHeight: el.lineHeight ?? 1.2,
                      letterSpacing: `${el.letterSpacing ?? 0}px`,
                      WebkitTextStroke: el.textStrokeWidth
                        ? `${el.textStrokeWidth * previewScale}px ${el.textStroke || '#000'}`
                        : undefined,
                    }}
                  >
                    {el.content}
                  </div>
                )}

                {/* Placeholder */}
                {el.type === 'placeholder' && (
                  <div
                    className="whitespace-nowrap"
                    style={{
                      fontSize: `${(el.fontSize || 16) * previewScale}px`,
                      fontFamily: el.fontFamily,
                      fontWeight: el.fontWeight,
                      fontStyle: el.fontStyle,
                      textDecoration: el.textDecoration,
                      color: el.color,
                      textAlign: el.textAlign,
                      lineHeight: el.lineHeight ?? 1.2,
                      letterSpacing: `${el.letterSpacing ?? 0}px`,
                      WebkitTextStroke: el.textStrokeWidth
                        ? `${el.textStrokeWidth * previewScale}px ${el.textStroke || '#000'}`
                        : undefined,
                    }}
                  >
                    {PLACEHOLDER_LABELS[el.placeholderType || 'name']}
                  </div>
                )}

                {/* Shape */}
                {el.type === 'shape' && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: el.fill,
                      borderRadius: el.shapeType === 'circle' ? '50%' : 0,
                      border: el.strokeWidth
                        ? `${el.strokeWidth}px solid ${el.stroke || '#000'}`
                        : undefined,
                    }}
                  />
                )}

                {/* Image */}
                {el.type === 'image' && el.src && (
                  <div
                    className="w-full h-full bg-cover bg-center bg-no-repeat pointer-events-none"
                    style={{
                      backgroundImage: `url(${el.src})`,
                      borderRadius: `${el.borderRadius ?? 0}px`,
                      filter: `brightness(${el.brightness ?? 100}%) contrast(${el.contrast ?? 100}%) grayscale(${el.grayscale ?? 0}%)`,
                    }}
                  />
                )}

                {/* Icon */}
                {el.type === 'icon' && el.iconName && (
                  <div
                    className="w-full h-full flex items-center justify-center pointer-events-none"
                    style={{
                      color: el.stroke || '#000000',
                    }}
                  >
                    {(() => {
                      const IconComp = ICON_MAP[el.iconName as string] || Star;
                      return (
                        <IconComp strokeWidth={el.strokeWidth || 2} className="w-full h-full" />
                      );
                    })()}
                  </div>
                )}

                {/* QR Code */}
                {el.type === 'qr' && (
                  <div className="w-full h-full flex items-center justify-center pointer-events-none bg-white p-1">
                    <QRCodeSVG
                      value={el.qrData || 'https://ecert.com'}
                      width="100%"
                      height="100%"
                      fgColor={el.color || '#000000'}
                      bgColor="transparent"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
