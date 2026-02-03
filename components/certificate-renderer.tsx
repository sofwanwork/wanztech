import { CertificateTemplate, CertificateElement } from '@/lib/types';
import React from 'react';

interface CertificateRendererProps {
  template: CertificateTemplate;
  data: {
    name: string;
    program: string;
    date: string;
    signature?: string;
  };
  id?: string;
}

export function CertificateRenderer({ template, data, id }: CertificateRendererProps) {
  const { width = 1123, height = 794, backgroundColor, backgroundImage, elements = [] } = template;

  // Safety check for dimensions to avoid division by zero
  const safeWidth = Number(width) || 1123;
  const safeHeight = Number(height) || 794;

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
              el.type === 'image' || el.type === 'shape'
                ? `${(Number(el.width) / safeWidth) * 100}%`
                : 'auto', // Auto width for text to allow centering
            height:
              el.type === 'image' || el.type === 'shape'
                ? `${(Number(el.height) / safeHeight) * 100}%`
                : 'auto',
            transform: 'translate(-50%, -50%)',
            zIndex: el.type === 'image' || el.type === 'shape' ? 0 : 10,
            whiteSpace: 'nowrap', // Prevent wrapping usually
            // Apply specific text styles
            fontSize: el.fontSize ? `${Number(el.fontSize)}px` : undefined,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle,
            color: el.color,
            textAlign: el.textAlign,
          }}
        >
          {el.type === 'image' && el.src && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={el.src}
                alt=""
                className="w-full h-full object-cover"
                style={{ opacity: el.opacity }}
              />
            </>
          )}
          {el.type === 'shape' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: el.fill,
                borderRadius: el.shapeType === 'circle' ? '50%' : 0,
                opacity: el.opacity,
              }}
            />
          )}
          {(el.type === 'text' || el.type === 'placeholder') && (
            <div style={{ pointerEvents: 'none' }}>{resolveContent(el)}</div>
          )}
        </div>
      ))}
    </div>
  );
}
