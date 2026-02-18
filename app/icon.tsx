import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff', // White background
        borderRadius: '20%', // Rounded square (squircle)
        border: '1px solid #f3f4f6', // Subtle border for visibility on light mode
      }}
    >
      <svg width="24" height="24" viewBox="0 0 100 100" fill="none" style={{ color: '#7c3aed' }}>
        {/* Simplified KlikForm logo - two interlocking circles */}
        <circle cx="35" cy="50" r="25" stroke="#7c3aed" strokeWidth="6" fill="none" />
        <circle cx="65" cy="50" r="25" stroke="#7c3aed" strokeWidth="6" fill="none" />
        <ellipse cx="50" cy="50" rx="12" ry="20" stroke="#7c3aed" strokeWidth="5" fill="none" />
      </svg>
    </div>,
    {
      ...size,
    }
  );
}
