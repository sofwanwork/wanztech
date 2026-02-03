import { TemplateProps } from '../types';

export function VintageTemplate({ id, name, program, formattedDate }: TemplateProps) {
  return (
    <div
      id={id}
      className="w-full aspect-[297/210] relative overflow-hidden"
      style={{ backgroundColor: '#fef3e2' }}
    >
      {/* Ornate Border */}
      <div className="absolute inset-4" style={{ border: '4px double #8b4513' }}></div>
      <div className="absolute inset-6" style={{ border: '1px solid #d4a574' }}></div>

      {/* Corner Flourishes */}
      <div
        className="absolute top-8 left-8 w-16 h-16"
        style={{ borderTop: '2px solid #8b4513', borderLeft: '2px solid #8b4513' }}
      ></div>
      <div
        className="absolute top-8 right-8 w-16 h-16"
        style={{ borderTop: '2px solid #8b4513', borderRight: '2px solid #8b4513' }}
      ></div>
      <div
        className="absolute bottom-8 left-8 w-16 h-16"
        style={{ borderBottom: '2px solid #8b4513', borderLeft: '2px solid #8b4513' }}
      ></div>
      <div
        className="absolute bottom-8 right-8 w-16 h-16"
        style={{ borderBottom: '2px solid #8b4513', borderRight: '2px solid #8b4513' }}
      ></div>

      {/* Seal */}
      <div className="absolute top-10 left-10 z-20">
        <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-md">
          <defs>
            <linearGradient id="vintageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#d4a574', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#8b4513', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path
            d="M50,2 L62,18 L82,15 L85,35 L100,45 L88,62 L95,80 L75,85 L65,100 L50,88 L35,100 L25,85 L5,80 L12,62 L0,45 L15,35 L18,15 L38,18 Z"
            fill="url(#vintageGrad)"
            stroke="#8b4513"
            strokeWidth="1"
          />
          <circle cx="50" cy="50" r="25" fill="none" stroke="#fef3e2" strokeWidth="2" />
          <path
            d="M50,32 L54,44 L66,44 L56,52 L60,64 L50,56 L40,64 L44,52 L34,44 L46,44 Z"
            fill="#fef3e2"
          />
        </svg>
      </div>

      {/* Header */}
      <div className="absolute top-12 left-0 z-10 text-center w-full">
        <h2 className="font-serif italic" style={{ color: '#8b4513', fontSize: '20px' }}>
          Certificate
        </h2>
        <h1
          className="font-serif uppercase tracking-wider"
          style={{ color: '#5c3317', fontSize: '42px' }}
        >
          Of Achievement
        </h1>
      </div>

      {/* Main Content */}
      <div className="absolute top-[180px] left-0 z-10 text-center w-full px-16">
        <p className="font-serif italic text-base" style={{ color: '#8b4513' }}>
          This is to certify that
        </p>
      </div>

      <div className="absolute top-[220px] left-0 z-10 text-center w-full px-16">
        <h1 className="font-serif italic" style={{ color: '#5c3317', fontSize: '58px' }}>
          {name}
        </h1>
      </div>

      {/* Decorative Scroll */}
      <div className="absolute top-[310px] left-1/2 -translate-x-1/2 z-10">
        <svg className="w-40 h-6" viewBox="0 0 150 20" style={{ color: '#8b4513' }}>
          <path
            d="M10,10 Q40,0 75,10 T140,10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="absolute top-[340px] left-0 z-10 text-center w-full px-16">
        <p className="font-serif italic text-base mb-2" style={{ color: '#8b4513' }}>
          has successfully completed
        </p>
        <h3 className="font-serif" style={{ color: '#5c3317', fontSize: '36px' }}>
          {program}
        </h3>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 w-full z-10 flex justify-between items-end px-16">
        <div className="text-center">
          <p className="font-serif mb-3" style={{ color: '#5c3317', fontSize: '16px' }}>
            {formattedDate}
          </p>
          <div className="w-32" style={{ borderTop: '1px solid #8b4513' }}>
            <span
              className="text-xs uppercase tracking-wider block mt-2 font-serif"
              style={{ color: '#8b4513' }}
            >
              Date
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="font-serif italic mb-3" style={{ color: '#5c3317', fontSize: '24px' }}>
            Signature
          </p>
          <div className="w-32" style={{ borderTop: '1px solid #8b4513' }}>
            <span
              className="text-xs uppercase tracking-wider block mt-2 font-serif"
              style={{ color: '#8b4513' }}
            >
              Authorized
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
