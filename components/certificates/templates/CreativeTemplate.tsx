import { TemplateProps } from '../types';

export function CreativeTemplate({ id, name, program, formattedDate }: TemplateProps) {
  return (
    <div
      id={id}
      className="w-full aspect-[297/210] relative overflow-hidden"
      style={{ backgroundColor: '#fefefe' }}
    >
      {/* Simple colorful corner decorations */}
      <div
        className="absolute -top-16 -left-16 w-48 h-48 rounded-full"
        style={{ backgroundColor: 'rgba(251, 146, 60, 0.3)' }}
      ></div>
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full"
        style={{ backgroundColor: 'rgba(34, 211, 238, 0.25)' }}
      ></div>
      <div
        className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full"
        style={{ backgroundColor: 'rgba(45, 212, 191, 0.25)' }}
      ></div>
      <div
        className="absolute -bottom-14 -right-14 w-48 h-48 rounded-full"
        style={{ backgroundColor: 'rgba(244, 114, 182, 0.25)' }}
      ></div>

      {/* Header */}
      <div className="absolute top-8 left-0 z-10 text-center w-full">
        <h2
          className="font-bold tracking-tight"
          style={{ fontFamily: 'Georgia, serif', color: '#1f2937', fontSize: '48px' }}
        >
          Certificate
        </h2>
        <p
          className="mt-1 italic"
          style={{ fontFamily: 'Georgia, serif', color: '#4b5563', fontSize: '20px' }}
        >
          of Participation
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="w-12 h-0.5" style={{ backgroundColor: '#9ca3af' }}></div>
          <div className="w-2 h-2 rounded-full" style={{ border: '2px solid #9ca3af' }}></div>
          <div className="w-12 h-0.5" style={{ backgroundColor: '#9ca3af' }}></div>
        </div>
      </div>

      {/* Body */}
      <div className="absolute top-[200px] left-0 z-10 text-center w-full px-12">
        <p className="italic text-lg mb-4" style={{ color: '#6b7280' }}>
          Awarded to:
        </p>
      </div>

      <div className="absolute top-[240px] left-0 z-10 text-center w-full px-12">
        <h1
          className="font-bold"
          style={{ fontFamily: 'Georgia, serif', color: '#1f2937', fontSize: '70px' }}
        >
          {name}
        </h1>
      </div>

      {/* Decorative swirl */}
      <div className="absolute top-[340px] left-1/2 -translate-x-1/2 z-10">
        <svg className="w-32 h-8" viewBox="0 0 120 30" style={{ color: '#9ca3af' }}>
          <path
            d="M10,15 Q30,5 60,15 T110,15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Program Section */}
      <div className="absolute top-[380px] left-0 z-10 text-center w-full px-12">
        <p className="text-lg mb-2" style={{ color: '#4b5563' }}>
          for participating in
        </p>
        <h3
          className="font-semibold italic max-w-2xl mx-auto"
          style={{ color: '#374151', fontSize: '48px' }}
        >
          {program}
        </h3>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 w-full z-10 flex justify-between items-end px-12">
        <div className="text-center">
          <p className="italic text-lg mb-2" style={{ color: '#374151' }}>
            {formattedDate}
          </p>
          <div className="w-28 pt-2" style={{ borderTop: '1px solid #9ca3af' }}>
            <span className="text-xs" style={{ color: '#6b7280' }}>
              Date
            </span>
          </div>
        </div>

        {/* Custom Seal */}
        <div className="mb-2">
          <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-md">
            <defs>
              <linearGradient id="creativeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#f472b6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#818cf8', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d="M50,2 L62,18 L82,15 L85,35 L100,45 L88,62 L95,80 L75,85 L65,100 L50,88 L35,100 L25,85 L5,80 L12,62 L0,45 L15,35 L18,15 L38,18 Z"
              fill="url(#creativeGradient)"
              stroke="#a78bfa"
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="25" fill="none" stroke="#ffffff" strokeWidth="2" />
            <path
              d="M50,35 L55,45 L65,45 L58,52 L61,62 L50,55 L39,62 L42,52 L35,45 L45,45 Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="italic text-lg mb-2" style={{ color: '#374151' }}>
            Signature
          </p>
          <div className="w-28 pt-2" style={{ borderTop: '1px solid #9ca3af' }}>
            <span className="text-xs" style={{ color: '#6b7280' }}>
              Authorized
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
