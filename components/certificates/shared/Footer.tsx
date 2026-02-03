// Reusable Footer component for certificate templates

interface FooterItemProps {
  label: string;
  value: string;
  isSignature?: boolean;
  colors: {
    text: string;
    border: string;
    label: string;
  };
}

function FooterItem({ label, value, isSignature, colors }: FooterItemProps) {
  return (
    <div className="text-center">
      <p
        className={`mb-3 ${isSignature ? 'font-serif italic text-2xl' : 'font-serif text-lg'}`}
        style={{ color: colors.text }}
      >
        {value}
      </p>
      <div className="w-32" style={{ borderTop: `2px solid ${colors.border}` }}>
        <span
          className="text-xs uppercase tracking-wider block mt-2"
          style={{ color: colors.label }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

interface FooterProps {
  date?: string;
  signatureText?: string;
  colors: {
    text: string;
    border: string;
    label: string;
  };
  className?: string;
}

export function Footer({
  date,
  signatureText = 'Signature',
  colors,
  className = 'absolute bottom-12 w-full z-10 flex justify-between items-end px-16',
}: FooterProps) {
  return (
    <div className={className}>
      <FooterItem label="Date" value={date || ''} colors={colors} />
      <FooterItem label="Authorized" value={signatureText} isSignature colors={colors} />
    </div>
  );
}
