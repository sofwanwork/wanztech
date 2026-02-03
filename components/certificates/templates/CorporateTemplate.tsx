import { TemplateProps } from '../types';

export function CorporateTemplate({ id, name, program, formattedDate }: TemplateProps) {
  return (
    <div
      id={id}
      className="w-full aspect-[297/210] relative overflow-hidden"
      style={{ backgroundColor: '#0f172a' }}
    >
      {/* Luxurious Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,215,0,0.1) 20px, rgba(255,215,0,0.1) 40px)',
          }}
        ></div>
      </div>

      {/* Gold Border Frame */}
      <div className="absolute inset-4" style={{ border: '3px solid #d4af37' }}></div>
      <div className="absolute inset-6" style={{ border: '1px solid rgba(212,175,55,0.4)' }}></div>

      {/* Decorative Gold Corners */}
      <div
        className="absolute top-6 left-6 w-16 h-16"
        style={{ borderTop: '4px solid #d4af37', borderLeft: '4px solid #d4af37' }}
      ></div>
      <div
        className="absolute top-6 right-6 w-16 h-16"
        style={{ borderTop: '4px solid #d4af37', borderRight: '4px solid #d4af37' }}
      ></div>
      <div
        className="absolute bottom-6 left-6 w-16 h-16"
        style={{ borderBottom: '4px solid #d4af37', borderLeft: '4px solid #d4af37' }}
      ></div>
      <div
        className="absolute bottom-6 right-6 w-16 h-16"
        style={{ borderBottom: '4px solid #d4af37', borderRight: '4px solid #d4af37' }}
      ></div>

      {/* Gold Seal */}
      <div className="absolute top-10 left-10 z-20">
        <div className="w-20 h-20 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            <defs>
              <linearGradient id="corpGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#b8860b', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d="M50,2 L62,18 L82,15 L85,35 L100,45 L88,62 L95,80 L75,85 L65,100 L50,88 L35,100 L25,85 L5,80 L12,62 L0,45 L15,35 L18,15 L38,18 Z"
              fill="url(#corpGoldGrad)"
              stroke="#fbbf24"
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="28" fill="none" stroke="#0f172a" strokeWidth="2" />
            <path
              d="M50,32 L54,44 L66,44 L56,52 L60,64 L50,56 L40,64 L44,52 L34,44 L46,44 Z"
              fill="#0f172a"
            />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-12 left-0 z-10 text-center w-full">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div
            className="w-24 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, #d4af37)' }}
          ></div>
          <span
            className="text-xs uppercase tracking-[0.3em] font-semibold"
            style={{ color: '#d4af37' }}
          >
            Certificate
          </span>
          <div
            className="w-24 h-[2px]"
            style={{ background: 'linear-gradient(90deg, #d4af37, transparent)' }}
          ></div>
        </div>
        <h2
          className="font-serif font-bold uppercase tracking-wider"
          style={{ color: '#ffffff', fontSize: '42px' }}
        >
          Of Excellence
        </h2>
      </div>

      {/* Main Content */}
      <div className="absolute top-[180px] left-0 z-10 text-center w-full px-16">
        <p
          className="uppercase tracking-[0.2em] text-sm mb-2"
          style={{ color: 'rgba(212,175,55,0.8)' }}
        >
          This is to certify that
        </p>
      </div>

      <div className="absolute top-[220px] left-0 z-10 text-center w-full px-16">
        <h1
          className="font-serif font-bold italic"
          style={{ color: '#d4af37', fontSize: '64px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}
        >
          {name}
        </h1>
      </div>

      {/* Decorative Underline */}
      <div className="absolute top-[320px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <div
          className="w-20 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, #d4af37)' }}
        ></div>
        <div className="w-2 h-2 rotate-45" style={{ backgroundColor: '#d4af37' }}></div>
        <div
          className="w-20 h-[1px]"
          style={{ background: 'linear-gradient(90deg, #d4af37, transparent)' }}
        ></div>
      </div>

      <div className="absolute top-[350px] left-0 z-10 text-center w-full px-16">
        <p
          className="uppercase tracking-[0.2em] text-sm mb-2"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          has successfully participated in
        </p>
      </div>

      {/* Program Section */}
      <div className="absolute top-[390px] left-0 z-10 text-center w-full px-16">
        <h3 className="font-serif font-semibold" style={{ color: '#ffffff', fontSize: '40px' }}>
          {program}
        </h3>
      </div>

      {/* Footer */}
      <div className="absolute bottom-10 w-full z-10 px-16">
        <div className="flex justify-between items-end">
          <div className="text-center">
            <p className="font-serif mb-3" style={{ color: '#d4af37', fontSize: '18px' }}>
              {formattedDate}
            </p>
            <div className="w-36" style={{ borderTop: '2px solid rgba(212,175,55,0.5)' }}>
              <span
                className="text-xs uppercase tracking-wider block mt-2"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Date
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="w-1 h-8"
              style={{ background: 'linear-gradient(180deg, #d4af37, transparent)' }}
            ></div>
          </div>

          <div className="text-center">
            <p className="font-serif italic mb-3" style={{ color: '#d4af37', fontSize: '24px' }}>
              Signature
            </p>
            <div className="w-36" style={{ borderTop: '2px solid rgba(212,175,55,0.5)' }}>
              <span
                className="text-xs uppercase tracking-wider block mt-2"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Authorized
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
