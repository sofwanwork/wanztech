import { TemplateProps } from '../types';

export function PremiumTemplate({ id, name, program, formattedDate }: TemplateProps) {
  return (
    <div
      id={id}
      className="w-full aspect-[297/210] relative overflow-hidden"
      style={{ backgroundColor: '#1a1a1a' }}
    >
      {/* Gold Border */}
      <div className="absolute inset-3" style={{ border: '2px solid #c9a227' }}></div>
      <div className="absolute inset-5" style={{ border: '1px solid rgba(201,162,39,0.3)' }}></div>

      {/* Corner Ornaments */}
      <div
        className="absolute top-5 left-5 w-12 h-12"
        style={{ borderTop: '3px solid #c9a227', borderLeft: '3px solid #c9a227' }}
      ></div>
      <div
        className="absolute top-5 right-5 w-12 h-12"
        style={{ borderTop: '3px solid #c9a227', borderRight: '3px solid #c9a227' }}
      ></div>
      <div
        className="absolute bottom-5 left-5 w-12 h-12"
        style={{ borderBottom: '3px solid #c9a227', borderLeft: '3px solid #c9a227' }}
      ></div>
      <div
        className="absolute bottom-5 right-5 w-12 h-12"
        style={{ borderBottom: '3px solid #c9a227', borderRight: '3px solid #c9a227' }}
      ></div>

      {/* Header */}
      <div className="absolute top-12 left-0 z-10 text-center w-full">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-16 h-px" style={{ backgroundColor: '#c9a227' }}></div>
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6"
            style={{ color: '#c9a227' }}
            fill="currentColor"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <div className="w-16 h-px" style={{ backgroundColor: '#c9a227' }}></div>
        </div>
        <h2
          className="font-serif uppercase tracking-[0.3em]"
          style={{ color: '#c9a227', fontSize: '16px' }}
        >
          Certificate of
        </h2>
        <h1
          className="font-serif uppercase tracking-wider mt-1"
          style={{ color: '#ffffff', fontSize: '44px' }}
        >
          Excellence
        </h1>
      </div>

      {/* Main Content */}
      <div className="absolute top-[190px] left-0 z-10 text-center w-full px-16">
        <p className="uppercase tracking-[0.2em] text-sm" style={{ color: 'rgba(201,162,39,0.7)' }}>
          This is to certify that
        </p>
      </div>

      <div className="absolute top-[230px] left-0 z-10 text-center w-full px-16">
        <h1 className="font-serif italic" style={{ color: '#c9a227', fontSize: '60px' }}>
          {name}
        </h1>
      </div>

      {/* Decorative Element */}
      <div className="absolute top-[330px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #c9a227)' }}
        ></div>
        <div className="w-2 h-2 rotate-45" style={{ backgroundColor: '#c9a227' }}></div>
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(90deg, #c9a227, transparent)' }}
        ></div>
      </div>

      <div className="absolute top-[360px] left-0 z-10 text-center w-full px-16">
        <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
          has achieved remarkable success in
        </p>
        <h3 className="font-serif" style={{ color: '#ffffff', fontSize: '36px' }}>
          {program}
        </h3>
      </div>

      {/* Footer */}
      <div className="absolute bottom-10 w-full z-10 flex justify-between items-end px-16">
        <div className="text-center">
          <p className="font-serif mb-3" style={{ color: '#c9a227', fontSize: '16px' }}>
            {formattedDate}
          </p>
          <div className="w-32" style={{ borderTop: '1px solid rgba(201,162,39,0.5)' }}>
            <span
              className="text-xs uppercase tracking-wider block mt-2"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Date
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="font-serif italic mb-3" style={{ color: '#c9a227', fontSize: '22px' }}>
            Signature
          </p>
          <div className="w-32" style={{ borderTop: '1px solid rgba(201,162,39,0.5)' }}>
            <span
              className="text-xs uppercase tracking-wider block mt-2"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Authorized
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
