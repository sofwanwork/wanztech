import { TemplateProps } from '../types';

export function NatureTemplate({ id, name, program, formattedDate }: TemplateProps) {
  return (
    <div
      id={id}
      className="w-full aspect-[297/210] relative overflow-hidden"
      style={{ backgroundColor: '#f0fdf4' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="leaf-pattern"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M20 0 C 10 10 10 30 20 40 C 30 30 30 10 20 0 Z"
                fill="currentColor"
                className="text-green-800"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#leaf-pattern)" />
        </svg>
      </div>

      {/* Gradient Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(240,253,244,0.9) 0%, rgba(220,252,231,0.8) 50%, rgba(187,247,208,0.6) 100%)',
        }}
      ></div>

      {/* Leaf Border */}
      <div className="absolute inset-6 z-10" style={{ border: '2px solid #22c55e' }}></div>

      {/* Corner Leaves */}
      <div
        className="absolute top-8 left-8 w-12 h-12 z-10"
        style={{
          borderTop: '3px solid #16a34a',
          borderLeft: '3px solid #16a34a',
          borderRadius: '0 0 100% 0',
        }}
      ></div>
      <div
        className="absolute top-8 right-8 w-12 h-12 z-10"
        style={{
          borderTop: '3px solid #16a34a',
          borderRight: '3px solid #16a34a',
          borderRadius: '0 0 0 100%',
        }}
      ></div>
      <div
        className="absolute bottom-8 left-8 w-12 h-12 z-10"
        style={{
          borderBottom: '3px solid #16a34a',
          borderLeft: '3px solid #16a34a',
          borderRadius: '0 100% 0 0',
        }}
      ></div>
      <div
        className="absolute bottom-8 right-8 w-12 h-12 z-10"
        style={{
          borderBottom: '3px solid #16a34a',
          borderRight: '3px solid #16a34a',
          borderRadius: '100% 0 0 0',
        }}
      ></div>

      {/* Leaf Seal */}
      <div className="absolute top-10 left-10 z-20">
        <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-md">
          <circle cx="40" cy="40" r="35" fill="#22c55e" />
          <circle cx="40" cy="40" r="28" fill="none" stroke="#ffffff" strokeWidth="2" />
          <path d="M40,20 Q55,35 40,55 Q25,35 40,20" fill="#ffffff" />
        </svg>
      </div>

      {/* Header */}
      <div className="absolute top-24 left-0 z-10 text-center w-full">
        <h2 className="uppercase tracking-[0.3em]" style={{ color: '#16a34a', fontSize: '14px' }}>
          Certificate of
        </h2>
        <h1 className="font-serif" style={{ color: '#14532d', fontSize: '44px' }}>
          Participation
        </h1>
      </div>

      {/* Main Content */}
      <div className="absolute top-[230px] left-0 z-10 text-center w-full px-16">
        <p className="text-base" style={{ color: '#4ade80' }}>
          This certifies that
        </p>
      </div>

      <div className="absolute top-[270px] left-0 z-10 text-center w-full px-16">
        <h1 className="font-serif" style={{ color: '#14532d', fontSize: '58px' }}>
          {name}
        </h1>
      </div>

      {/* Leaf Divider */}
      <div className="absolute top-[360px] left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #22c55e)' }}
        ></div>
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#22c55e">
          <path d="M12,3 C8,8 4,14 4,17 C4,20 8,22 12,22 C16,22 20,20 20,17 C20,14 16,8 12,3 Z" />
        </svg>
        <div
          className="w-16 h-px"
          style={{ background: 'linear-gradient(90deg, #22c55e, transparent)' }}
        ></div>
      </div>

      <div className="absolute top-[405px] left-0 z-10 text-center w-full px-16">
        <p className="text-base mb-2" style={{ color: '#4ade80' }}>
          has participated in
        </p>
        <h3 className="font-serif" style={{ color: '#14532d', fontSize: '36px' }}>
          {program}
        </h3>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 w-full z-10 flex justify-between items-end px-16">
        <div className="text-center">
          <p className="font-serif mb-3" style={{ color: '#14532d', fontSize: '16px' }}>
            {formattedDate}
          </p>
          <div className="w-32" style={{ borderTop: '2px solid #22c55e' }}>
            <span
              className="text-xs uppercase tracking-wider block mt-2"
              style={{ color: '#16a34a' }}
            >
              Date
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="font-serif italic mb-3" style={{ color: '#14532d', fontSize: '22px' }}>
            Signature
          </p>
          <div className="w-32" style={{ borderTop: '2px solid #22c55e' }}>
            <span
              className="text-xs uppercase tracking-wider block mt-2"
              style={{ color: '#16a34a' }}
            >
              Authorized
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
