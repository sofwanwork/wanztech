import { TemplateProps } from '../types';

export function RoyalTemplate({ id, name, program, formattedDate }: TemplateProps) {
  return (
    <div
      id={id}
      className="w-full aspect-[297/210] relative overflow-hidden"
      style={{ backgroundColor: '#1e1b4b' }}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, #a855f7 1px, transparent 1px), radial-gradient(circle at 75% 75%, #a855f7 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      ></div>

      {/* Purple/Gold Border */}
      <div className="absolute inset-4" style={{ border: '3px solid #a855f7' }}></div>
      <div className="absolute inset-6" style={{ border: '1px solid rgba(250,204,21,0.4)' }}></div>

      {/* Decorative Corners */}
      <div
        className="absolute top-6 left-6 w-14 h-14"
        style={{ borderTop: '4px solid #fbbf24', borderLeft: '4px solid #fbbf24' }}
      ></div>
      <div
        className="absolute top-6 right-6 w-14 h-14"
        style={{ borderTop: '4px solid #fbbf24', borderRight: '4px solid #fbbf24' }}
      ></div>
      <div
        className="absolute bottom-6 left-6 w-14 h-14"
        style={{ borderBottom: '4px solid #fbbf24', borderLeft: '4px solid #fbbf24' }}
      ></div>
      <div
        className="absolute bottom-6 right-6 w-14 h-14"
        style={{ borderBottom: '4px solid #fbbf24', borderRight: '4px solid #fbbf24' }}
      ></div>

      {/* Crown Seal */}
      <div className="absolute top-10 left-10 z-20">
        <svg viewBox="0 0 80 80" className="w-18 h-18 drop-shadow-lg">
          <defs>
            <linearGradient id="royalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="35" fill="url(#royalGrad)" />
          <circle cx="40" cy="40" r="28" fill="none" stroke="#1e1b4b" strokeWidth="2" />
          <path d="M25,45 L30,30 L35,40 L40,25 L45,40 L50,30 L55,45 Z" fill="#1e1b4b" />
        </svg>
      </div>

      {/* Header */}
      <div className="absolute top-12 left-0 z-10 text-center w-full">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div
            className="w-20 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #fbbf24)' }}
          ></div>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#fbbf24">
            <path d="M5,16L3,5L8.5,10L12,4L15.5,10L21,5L19,16H5M19,19A1,1 0 0,1 18,20H6A1,1 0 0,1 5,19V18H19V19Z" />
          </svg>
          <div
            className="w-20 h-px"
            style={{ background: 'linear-gradient(90deg, #fbbf24, transparent)' }}
          ></div>
        </div>
        <h2 className="uppercase tracking-[0.4em]" style={{ color: '#fbbf24', fontSize: '14px' }}>
          Royal Certificate
        </h2>
        <h1
          className="font-serif uppercase tracking-wider mt-1"
          style={{ color: '#ffffff', fontSize: '40px' }}
        >
          Of Honor
        </h1>
      </div>

      {/* Main Content */}
      <div className="absolute top-[185px] left-0 z-10 text-center w-full px-16">
        <p className="uppercase tracking-[0.2em] text-sm" style={{ color: 'rgba(250,204,21,0.8)' }}>
          This honor is bestowed upon
        </p>
      </div>

      <div className="absolute top-[225px] left-0 z-10 text-center w-full px-16">
        <h1
          className="font-serif italic"
          style={{ color: '#fbbf24', fontSize: '58px', textShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}
        >
          {name}
        </h1>
      </div>

      {/* Decorative Crown Divider */}
      <div className="absolute top-[315px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #a855f7)' }}
        ></div>
        <div className="w-3 h-3 rotate-45" style={{ backgroundColor: '#fbbf24' }}></div>
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(90deg, #a855f7, transparent)' }}
        ></div>
      </div>

      <div className="absolute top-[350px] left-0 z-10 text-center w-full px-16">
        <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
          for outstanding achievement in
        </p>
        <h3 className="font-serif" style={{ color: '#ffffff', fontSize: '36px' }}>
          {program}
        </h3>
      </div>

      {/* Footer */}
      <div className="absolute bottom-10 w-full z-10 flex justify-between items-end px-16">
        <div className="text-center">
          <p className="font-serif mb-3" style={{ color: '#fbbf24', fontSize: '16px' }}>
            {formattedDate}
          </p>
          <div className="w-32" style={{ borderTop: '2px solid rgba(168,85,247,0.6)' }}>
            <span
              className="text-xs uppercase tracking-wider block mt-2"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Date
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="font-serif italic mb-3" style={{ color: '#fbbf24', fontSize: '22px' }}>
            Signature
          </p>
          <div className="w-32" style={{ borderTop: '2px solid rgba(168,85,247,0.6)' }}>
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
  );
}
