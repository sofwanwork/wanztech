import { TemplateProps } from '../types';

export function MinimalistTemplate({ id, name, program, formattedDate }: TemplateProps) {
  return (
    <div
      id={id}
      className="w-full aspect-[297/210] relative overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Subtle border */}
      <div className="absolute inset-8" style={{ border: '1px solid #e5e7eb' }}></div>

      {/* Header */}
      <div className="absolute top-16 left-0 z-10 text-center w-full">
        <h2
          className="font-light uppercase tracking-[0.5em]"
          style={{ color: '#374151', fontSize: '14px' }}
        >
          Certificate of
        </h2>
        <h1
          className="font-light uppercase tracking-[0.3em] mt-2"
          style={{ color: '#111827', fontSize: '48px' }}
        >
          Achievement
        </h1>
      </div>

      {/* Main Content */}
      <div className="absolute top-[200px] left-0 z-10 text-center w-full px-16">
        <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
          This certificate is presented to
        </p>
      </div>

      <div className="absolute top-[240px] left-0 z-10 text-center w-full px-16">
        <h1 className="font-light" style={{ color: '#111827', fontSize: '56px' }}>
          {name}
        </h1>
      </div>

      {/* Simple Line */}
      <div
        className="absolute top-[330px] left-1/2 -translate-x-1/2 z-10 w-48 h-px"
        style={{ backgroundColor: '#d1d5db' }}
      ></div>

      <div className="absolute top-[360px] left-0 z-10 text-center w-full px-16">
        <p className="text-sm mb-2" style={{ color: '#9ca3af' }}>
          for completing
        </p>
        <h3 className="font-light" style={{ color: '#374151', fontSize: '32px' }}>
          {program}
        </h3>
      </div>

      {/* Footer */}
      <div className="absolute bottom-16 w-full z-10 flex justify-between items-end px-16">
        <div className="text-center">
          <p className="font-light mb-3" style={{ color: '#374151', fontSize: '16px' }}>
            {formattedDate}
          </p>
          <div className="w-32 h-px" style={{ backgroundColor: '#d1d5db' }}></div>
          <span
            className="text-xs uppercase tracking-wider mt-2 block"
            style={{ color: '#9ca3af' }}
          >
            Date
          </span>
        </div>

        <div className="text-center">
          <p className="font-light italic mb-3" style={{ color: '#374151', fontSize: '20px' }}>
            Signature
          </p>
          <div className="w-32 h-px" style={{ backgroundColor: '#d1d5db' }}></div>
          <span
            className="text-xs uppercase tracking-wider mt-2 block"
            style={{ color: '#9ca3af' }}
          >
            Authorized
          </span>
        </div>
      </div>
    </div>
  );
}
