import { CertificateTemplate, CertificateElement } from '@/lib/types';
import { getProgramFontSize } from '@/components/certificates/types';
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
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

interface CertificateRendererProps {
  template: CertificateTemplate;
  data: {
    name: string;
    program: string;
    date: string;
    signature?: string;
    ic?: string; // IC number for verification URL
    serial?: string; // Deterministic certificate serial code
    formId?: string; // Form ID for verification URL
    organization?: string;
    role?: string;
    grade?: string;
  };
  id?: string;
}

export function CertificateRenderer({ template, data, id }: CertificateRendererProps) {
  const { width = 1123, height = 794, backgroundColor, backgroundImage, elements = [] } = template;

  // Safety check for dimensions to avoid division by zero
  const safeWidth = Number(width) || 1123;
  const safeHeight = Number(height) || 794;

  // Generate verification URL
  const getVerifyUrl = () => {
    if (!data.formId || !data.ic) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/verify/${data.formId}?ic=${encodeURIComponent(data.ic)}`;
  };

  // Resolve QR data - replace placeholder with actual verification URL
  const resolveQrData = (el: CertificateElement) => {
    const qrData = el.qrData || '';
    if (qrData === '{VERIFY_URL}') {
      return getVerifyUrl();
    }
    return qrData;
  };

  // Resolve placeholder content
  const resolveContent = (el: CertificateElement) => {
    if (el.type === 'text') return el.content;
    if (el.type === 'placeholder') {
      const key = el.placeholderType as keyof typeof data;
      const val = data[key] || el.content || '';
      if (el.placeholderType === 'ic' && typeof val === 'string') {
        const clean = val.replace(/\D/g, '');
        if (clean.length === 12) {
          return `${clean.slice(0, 6)}-${clean.slice(6, 8)}-${clean.slice(8, 12)}`;
        }
      }
      return val;
    }
    return '';
  };

  return (
    <div
      id={id}
      className="certificate-renderer relative overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: backgroundColor || '#ffffff',
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Google Fonts for Certificates */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;700&family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@700&family=Great+Vibes&family=Montserrat:wght@400;700&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:wght@400;600;700&display=swap"
      />
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute"
          style={{
            left: `${(Number(el.x) / safeWidth) * 100}%`,
            top: `${(Number(el.y) / safeHeight) * 100}%`,
            width:
              el.type === 'image' || el.type === 'shape' || el.type === 'qr' || el.type === 'icon'
                ? `${(Number(el.width) / safeWidth) * 100}%`
                : el.width && el.width > 0
                  ? `${(Number(el.width) / safeWidth) * 100}%`
                  : 'auto',
            maxWidth: el.type === 'text' || el.type === 'placeholder' ? '92%' : undefined,
            height:
              el.type === 'image' || el.type === 'shape' || el.type === 'qr' || el.type === 'icon'
                ? `${(Number(el.height) / safeHeight) * 100}%`
                : 'auto',
            transform: `translate(-50%, -50%) rotate(${el.rotation ?? 0}deg)`,
            zIndex: el.type === 'image' || el.type === 'shape' ? 0 : 10,
            opacity: el.opacity ?? 1,
            boxShadow: el.shadow?.enabled
              ? `${el.shadow.offsetX}px ${el.shadow.offsetY}px ${el.shadow.blur}px ${el.shadow.color}`
              : undefined,
            borderRadius: `${el.borderRadius ?? 0}px`,
            whiteSpace: el.type === 'text' || el.type === 'placeholder' ? 'pre-line' : 'nowrap',
            wordBreak: el.type === 'text' || el.type === 'placeholder' ? 'break-word' : undefined,
            // Apply specific text styles (with smart scaling for program placeholder)
            fontSize: (() => {
              if (!el.fontSize) return undefined;
              const base = Number(el.fontSize);
              if (el.type === 'placeholder' && el.placeholderType === 'program') {
                return `${getProgramFontSize(data.program || el.content, base)}px`;
              }
              return `${base}px`;
            })(),
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle,
            color: el.color,
            textAlign: el.textAlign,
            lineHeight: el.lineHeight ?? 1.2,
            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
            textDecoration: el.textDecoration,
            WebkitTextStroke: el.textStrokeWidth
              ? `${el.textStrokeWidth}px ${el.textStroke || '#000'}`
              : undefined,
          }}
        >
          {/* Image */}
          {el.type === 'image' && el.src && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={el.src}
                alt=""
                className="w-full h-full object-cover"
                style={{
                  opacity: el.opacity,
                  borderRadius: `${el.borderRadius ?? 0}px`,
                  filter: `brightness(${el.brightness ?? 100}%) contrast(${el.contrast ?? 100}%) grayscale(${el.grayscale ?? 0}%)`,
                }}
              />
            </>
          )}

          {/* Shape */}
          {el.type === 'shape' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: el.fill,
                borderRadius: el.shapeType === 'circle' ? '50%' : 0,
                opacity: el.opacity,
                border: el.strokeWidth
                  ? `${el.strokeWidth}px solid ${el.stroke || '#000'}`
                  : undefined,
              }}
            />
          )}

          {/* QR Code */}
          {el.type === 'qr' && (
            <div className="w-full h-full flex items-center justify-center bg-white p-1">
              <QRCodeSVG
                value={resolveQrData(el) || 'https://example.com'}
                size={Math.min(Number(el.width), Number(el.height)) * 0.9}
                fgColor={el.color || '#000000'}
                bgColor="transparent"
              />
            </div>
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

          {/* Text & Placeholder */}
          {(el.type === 'text' || el.type === 'placeholder') && (
            <div className="whitespace-pre-line break-words [text-wrap:balance]" style={{ pointerEvents: 'none' }}>
              {resolveContent(el)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
