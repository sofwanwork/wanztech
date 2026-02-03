import { TemplateProps } from '../types';

export function ClassicTemplate({ id, name, program, formattedDate }: TemplateProps) {
  return (
    <div
      id={id}
      className="w-full aspect-[297/210] relative p-6 overflow-hidden"
      style={{ backgroundColor: '#ffffff', border: '20px solid #1e293b', aspectRatio: '297/210' }}
    >
      {/* Inner Border Frame */}
      <div
        className="absolute inset-5 pointer-events-none"
        style={{ border: '2px solid #334155' }}
      ></div>

      {/* Seal - Top Left */}
      <div className="absolute top-8 left-8 z-20">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            <defs>
              <linearGradient id="goldGradientClassic" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#b45309', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d="M50,2 L62,18 L82,15 L85,35 L100,45 L88,62 L95,80 L75,85 L65,100 L50,88 L35,100 L25,85 L5,80 L12,62 L0,45 L15,35 L18,15 L38,18 Z"
              fill="url(#goldGradientClassic)"
              stroke="#78350f"
              strokeWidth="1"
            />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#fffbeb" strokeWidth="3" />
            <path
              d="M50,30 L55,45 L70,45 L58,55 L63,70 L50,60 L37,70 L42,55 L30,45 L45,45 Z"
              fill="#fffbeb"
            />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-10 left-0 z-10 text-center w-full">
        <h1
          className="font-serif font-bold mb-1 uppercase tracking-wide"
          style={{ color: '#1e293b', fontSize: '48px' }}
        >
          CERTIFICATE
        </h1>
        <p className="font-serif italic text-gray-600" style={{ fontSize: '20px' }}>
          of Participation
        </p>
      </div>

      {/* Body */}
      <div className="absolute top-[200px] left-0 z-10 text-center w-full px-12">
        <p className="text-base text-gray-500 font-sans">This is to certify that</p>
      </div>

      <div className="absolute top-[240px] left-0 z-10 text-center w-full px-12">
        <h1
          className="font-bold font-serif italic capitalize"
          style={{ color: '#0f172a', fontSize: '70px' }}
        >
          {name}
        </h1>
      </div>

      <div className="absolute top-[350px] left-0 z-10 text-center w-full px-12">
        <p className="text-base text-gray-500 font-sans">has successfully completed the program</p>
      </div>

      <div className="absolute top-[390px] left-0 z-10 text-center w-full px-12">
        <h3 className="font-bold font-serif" style={{ color: '#1e293b', fontSize: '48px' }}>
          {program}
        </h3>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 w-full z-10 flex justify-between items-end px-12">
        <div className="text-center">
          <p className="text-lg font-serif mb-2 font-semibold" style={{ color: '#1e293b' }}>
            {formattedDate}
          </p>
          <div className="w-28 h-px bg-slate-400 mb-2"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">DATE</p>
        </div>
        <div className="text-center">
          <div className="font-script text-3xl mb-2 text-slate-800">Director</div>
          <div className="w-28 h-px bg-slate-400 mb-2"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">SIGNATURE</p>
        </div>
      </div>
    </div>
  );
}
