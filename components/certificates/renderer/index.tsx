import { CertificateTemplate, CertificateElement } from '@/lib/types';
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
      return data[key] || el.content || '';
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
                : 'auto', // Auto width for text to allow centering
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
            whiteSpace: 'nowrap', // Prevent wrapping usually
            // Apply specific text styles
            fontSize: el.fontSize ? `${Number(el.fontSize)}px` : undefined,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle,
            color: el.color,
            textAlign: el.textAlign,
            lineHeight: el.lineHeight ?? undefined,
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
            <div style={{ pointerEvents: 'none' }}>{resolveContent(el)}</div>
          )}
        </div>
      ))}
    </div>
  );
}
