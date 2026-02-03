// Reusable decorative border components

interface CornerBordersProps {
  color: string;
  size?: string;
  thickness?: string;
  offset?: string;
}

export function CornerBorders({
  color,
  size = 'w-14 h-14',
  thickness = '4px',
  offset = '6',
}: CornerBordersProps) {
  const borderStyle = { borderColor: color, borderWidth: thickness };

  return (
    <>
      <div
        className={`absolute top-${offset} left-${offset} ${size}`}
        style={{
          borderTop: `${thickness} solid ${color}`,
          borderLeft: `${thickness} solid ${color}`,
        }}
      />
      <div
        className={`absolute top-${offset} right-${offset} ${size}`}
        style={{
          borderTop: `${thickness} solid ${color}`,
          borderRight: `${thickness} solid ${color}`,
        }}
      />
      <div
        className={`absolute bottom-${offset} left-${offset} ${size}`}
        style={{
          borderBottom: `${thickness} solid ${color}`,
          borderLeft: `${thickness} solid ${color}`,
        }}
      />
      <div
        className={`absolute bottom-${offset} right-${offset} ${size}`}
        style={{
          borderBottom: `${thickness} solid ${color}`,
          borderRight: `${thickness} solid ${color}`,
        }}
      />
    </>
  );
}

interface DoubleBorderProps {
  outerColor: string;
  innerColor: string;
  outerInset?: string;
  innerInset?: string;
  outerWidth?: string;
  innerWidth?: string;
}

export function DoubleBorder({
  outerColor,
  innerColor,
  outerInset = '4',
  innerInset = '6',
  outerWidth = '3px',
  innerWidth = '1px',
}: DoubleBorderProps) {
  return (
    <>
      <div
        className={`absolute inset-${outerInset}`}
        style={{ border: `${outerWidth} solid ${outerColor}` }}
      />
      <div
        className={`absolute inset-${innerInset}`}
        style={{ border: `${innerWidth} solid ${innerColor}` }}
      />
    </>
  );
}

interface DecorativeDividerProps {
  color: string;
  accentColor?: string;
  className?: string;
}

export function DecorativeDivider({
  color,
  accentColor,
  className = 'absolute left-1/2 -translate-x-1/2 z-10 flex items-center gap-3',
}: DecorativeDividerProps) {
  return (
    <div className={className}>
      <div
        className="w-20 h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color})` }}
      />
      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: accentColor || color }} />
      <div
        className="w-20 h-[1px]"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
    </div>
  );
}
