import { TemplateProps } from '../types';

export function ModernTemplate({ id, name, program, formattedDate }: TemplateProps) {
  return (
    <div
      id={id}
      className="w-full aspect-[297/210] relative p-6 overflow-hidden"
      style={{ backgroundColor: '#ffffff', border: '12px double #1e3a5f' }}
    >
      {/* Decorative Corner */}
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-bl-[100%] z-0"
        style={{ backgroundColor: 'rgba(219, 234, 254, 0.5)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-40 h-40 rounded-tr-[100%] z-0"
        style={{ backgroundColor: 'rgba(219, 234, 254, 0.5)' }}
      />

      {/* Header */}
      <div className="absolute top-8 left-0 z-10 text-center w-full">
        <div className="relative w-20 h-20 mx-auto mb-2 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="goldGradientModern" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#1e3a5f', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#1e40af', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d="M50,2 L62,18 L82,15 L85,35 L100,45 L88,62 L95,80 L75,85 L65,100 L50,88 L35,100 L25,85 L5,80 L12,62 L0,45 L15,35 L18,15 L38,18 Z"
              fill="url(#goldGradientModern)"
              stroke="#1e3a5f"
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#ffffff" strokeWidth="3" />
            <path
              d="M50,30 L55,45 L70,45 L58,55 L63,70 L50,60 L37,70 L42,55 L30,45 L45,45 Z"
              fill="#ffffff"
            />
          </svg>
        </div>
        <h2
          className="text-4xl font-bold tracking-widest uppercase mb-1"
          style={{ color: '#1e3a5f' }}
        >
          CERTIFICATE
        </h2>
        <p
          className="text-sm tracking-[0.3em] uppercase font-semibold"
          style={{ color: '#2563eb' }}
        >
          OF COMPLETION
        </p>
      </div>

      {/* Body */}
      <div className="absolute top-[260px] left-0 z-10 text-center w-full px-12">
        <p className="italic mb-2 text-base" style={{ color: '#4b5563' }}>
          This certificate is proudly presented to
        </p>
        <h1
          className="font-serif mb-4 font-bold capitalize"
          style={{ color: '#111827', fontSize: '60px' }}
        >
          {name}
        </h1>
      </div>

      {/* Underline */}
      <div
        className="absolute top-[390px] left-1/2 -translate-x-1/2 z-10 w-32 h-1"
        style={{ backgroundColor: '#1e3a5f' }}
      ></div>

      {/* Program Section */}
      <div className="absolute top-[420px] left-0 z-10 text-center w-full px-12">
        <p className="mb-2 text-lg" style={{ color: '#4b5563' }}>
          For successfully organizing/participating in
        </p>
        <h3 className="font-bold" style={{ color: '#1e40af', fontSize: '36px' }}>
          {program}
        </h3>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 w-full z-10 flex justify-between items-end px-12">
        <div className="text-center">
          <p className="font-medium mb-2 text-lg" style={{ color: '#1f2937' }}>
            {formattedDate}
          </p>
          <div
            className="w-32 pt-2 text-xs uppercase tracking-wider font-semibold"
            style={{ borderTop: '2px solid #374151', color: '#374151' }}
          >
            Date
          </div>
        </div>
        <div className="text-center">
          <p
            className="font-script text-3xl mb-2 italic transform -rotate-6"
            style={{ color: '#1e3a5f' }}
          >
            Signature
          </p>
          <div
            className="w-32 pt-2 text-xs uppercase tracking-wider font-semibold"
            style={{ borderTop: '2px solid #374151', color: '#374151' }}
          >
            Authorized
          </div>
        </div>
      </div>
    </div>
  );
}
