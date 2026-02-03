import { TemplateProps } from '../types';

export function ElegantTemplate({ id, name, program, formattedDate }: TemplateProps) {
  return (
    <div
      id={id}
      className="w-full aspect-[297/210] relative p-12 flex flex-col items-center justify-between overflow-hidden"
      style={{ backgroundColor: '#fdfbf7', border: '10px solid #ca8a04' }}
    >
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="elegant-pattern"
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M50 0 C 20 20 20 80 50 100 C 80 80 80 20 50 0 Z M0 50 C 20 20 80 20 100 50 C 80 80 20 80 0 50 Z"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#elegant-pattern)" />
        </svg>
      </div>

      <div
        className="absolute inset-4 z-0"
        style={{ border: '2px solid rgba(202, 138, 4, 0.3)' }}
      ></div>

      {/* Seal */}
      <div className="absolute top-8 left-6 z-20">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FFEDA3', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#B4922B', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d="M50,2 L62,18 L82,15 L85,35 L100,45 L88,62 L95,80 L75,85 L65,100 L50,88 L35,100 L25,85 L5,80 L12,62 L0,45 L15,35 L18,15 L38,18 Z"
              fill="url(#goldGradient)"
              stroke="#B4922B"
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#F9F1D8" strokeWidth="3" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="#F9F1D8" strokeWidth="1" />
            <path
              d="M50,30 L55,45 L70,45 L58,55 L63,70 L50,60 L37,70 L42,55 L30,45 L45,45 Z"
              fill="#F9F1D8"
            />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-32 z-10 text-center w-full">
        <h2 className="text-6xl font-serif tracking-tight" style={{ color: '#854d0e' }}>
          Certificate
        </h2>
        <p className="text-2xl italic mt-1" style={{ color: '#a16207' }}>
          of Achievement
        </p>
      </div>

      {/* Body */}
      <div className="absolute top-[280px] left-0 z-10 text-center w-full px-12">
        <p className="uppercase tracking-widest text-base mb-2" style={{ color: '#4b5563' }}>
          AWARDED TO
        </p>
        <h1
          className="font-serif leading-tight inline-block min-w-[450px]"
          style={{ color: '#111827', fontSize: '60px' }}
        >
          {name}
        </h1>
      </div>

      {/* Underline */}
      <div
        className="absolute top-[410px] left-1/2 -translate-x-1/2 z-10 w-[450px] h-[2px]"
        style={{ backgroundColor: '#d1d5db' }}
      ></div>

      {/* Program Section */}
      <div className="absolute top-[435px] left-0 z-10 text-center w-full px-12">
        <p className="text-lg mb-1" style={{ color: '#4b5563' }}>
          In recognition of outstanding participation in
        </p>
        <h3 className="font-serif italic" style={{ color: '#713f12', fontSize: '36px' }}>
          {program}
        </h3>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 w-full z-10 flex justify-between items-end px-12">
        <div className="text-center">
          <p className="text-lg mb-2 font-serif" style={{ color: '#1f2937' }}>
            {formattedDate}
          </p>
          <div className="w-32 mt-2" style={{ borderTop: '1px solid #9ca3af' }}>
            <span
              className="text-xs uppercase mt-1 block tracking-wider"
              style={{ color: '#6b7280' }}
            >
              Date
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="font-script text-3xl mb-2 italic" style={{ color: '#1f2937' }}>
            Signature
          </p>
          <div className="w-32 mt-2" style={{ borderTop: '1px solid #9ca3af' }}>
            <span
              className="text-xs uppercase mt-1 block tracking-wider"
              style={{ color: '#6b7280' }}
            >
              Authorized
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
