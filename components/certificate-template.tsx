import { templateRegistry, templateList } from './certificates';
import { CertificateTemplate as CertificateTemplateType } from '@/lib/types';
import { CertificateRenderer } from './certificates/renderer';

interface CertificateTemplateProps {
  type: string;
  name: string;
  program: string;
  date?: string;
  id?: string;
  customTemplateData?: CertificateTemplateType | null;
  ic?: string; // IC for QR verification URL
  formId?: string; // Form ID for QR verification URL
}

export function CertificateTemplate({
  type,
  name,
  program,
  date,
  id,
  customTemplateData,
  ic,
  formId,
}: CertificateTemplateProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : undefined;

  // Use custom JSON template if available
  if (customTemplateData) {
    return (
      <CertificateRenderer
        id={id}
        template={customTemplateData}
        data={{
          name,
          program,
          date: formattedDate || date || '', // Use formatted if available
          ic,
          formId,
        }}
      />
    );
  }

  // Handle custom URL templates (Legacy URL-based)
  const isCustom = type.startsWith('http');
  if (isCustom) {
    return (
      <div
        id={id}
        className="relative w-full aspect-[297/210] bg-white text-center overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={type}
          alt="Certificate Background"
          className="absolute inset-0 w-full h-full object-cover z-0"
          crossOrigin="anonymous"
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full pt-16 px-12">
          <h1
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 uppercase tracking-wider"
            style={{ textShadow: '2px 2px 4px rgba(255,255,255,0.8)' }}
          >
            {name}
          </h1>
          <p
            className="text-xl text-gray-800 font-medium mb-2"
            style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
          >
            Program:
          </p>
          <h2
            className="text-2xl md:text-3xl text-gray-900 font-bold mb-8"
            style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
          >
            {program}
          </h2>
          {formattedDate && (
            <p
              className="text-lg text-gray-700"
              style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
            >
              {formattedDate}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Get the template component from registry
  // Default to 'classic' if type is not found (which happens for UUIDs if customTemplateData is missing)
  const TemplateComponent = templateRegistry[type] || templateRegistry['classic'];

  return <TemplateComponent id={id} name={name} program={program} formattedDate={formattedDate} />;
}

// Re-export template list for use in selectors
export { templateList };
