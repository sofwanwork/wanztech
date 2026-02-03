// Reusable Seal component for certificate templates

interface SealProps {
  gradientId: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    inner: string;
  };
  className?: string;
}

export function Seal({ gradientId, colors, className = 'w-20 h-20' }: SealProps) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} drop-shadow-md`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
          {colors.accent && (
            <stop offset="50%" style={{ stopColor: colors.accent, stopOpacity: 1 }} />
          )}
          <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path
        d="M50,2 L62,18 L82,15 L85,35 L100,45 L88,62 L95,80 L75,85 L65,100 L50,88 L35,100 L25,85 L5,80 L12,62 L0,45 L15,35 L18,15 L38,18 Z"
        fill={`url(#${gradientId})`}
        stroke={colors.secondary}
        strokeWidth="1"
      />
      <circle cx="50" cy="50" r="28" fill="none" stroke={colors.inner} strokeWidth="2" />
      <path
        d="M50,32 L54,44 L66,44 L56,52 L60,64 L50,56 L40,64 L44,52 L34,44 L46,44 Z"
        fill={colors.inner}
      />
    </svg>
  );
}

// Simple circle seal variant
export function CircleSeal({
  backgroundColor,
  borderColor,
  iconColor,
  className = 'w-16 h-16',
}: {
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 80 80" className={`${className} drop-shadow-md`}>
      <circle cx="40" cy="40" r="35" fill={backgroundColor} />
      <circle cx="40" cy="40" r="28" fill="none" stroke={borderColor} strokeWidth="2" />
      <path d="M40,20 Q55,35 40,55 Q25,35 40,20" fill={iconColor} />
    </svg>
  );
}
