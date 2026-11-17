import type { CSSProperties } from 'react';
import type { BackgroundPattern } from '@/lib/types/forms';

export interface FormPatternOption {
  id: BackgroundPattern;
  label: string;
  previewStyle: CSSProperties;
}

// Crisp, lightweight SVG Data URIs for modern patterns
const CROSSES_SVG_URI = `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 12h6M12 9v6' stroke='%23000000' stroke-width='1.5' stroke-linecap='round' stroke-opacity='0.25'/%3E%3C/svg%3E")`;

const TOPOGRAPHY_SVG_URI = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 16 Q 20 4, 40 16 T 80 16' stroke='%23000000' stroke-width='1.2' stroke-opacity='0.18'/%3E%3Cpath d='M0 32 Q 20 20, 40 32 T 80 32' stroke='%23000000' stroke-width='1' stroke-opacity='0.10'/%3E%3Cpath d='M0 56 Q 20 44, 40 56 T 80 56' stroke='%23000000' stroke-width='1.2' stroke-opacity='0.18'/%3E%3Cpath d='M0 72 Q 20 60, 40 72 T 80 72' stroke='%23000000' stroke-width='1' stroke-opacity='0.10'/%3E%3C/svg%3E")`;

const STARS_SVG_URI = `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 6 Q 24 15 33 15 Q 24 15 24 24 Q 24 15 15 15 Q 24 15 24 6 Z' fill='%23000000' fill-opacity='0.20'/%3E%3Cpath d='M42 34 Q 42 38 46 38 Q 42 38 42 42 Q 42 38 38 38 Q 42 38 42 34 Z' fill='%23000000' fill-opacity='0.15'/%3E%3Cpath d='M6 36 Q 6 39 9 39 Q 6 39 6 42 Q 6 39 3 39 Q 6 39 6 36 Z' fill='%23000000' fill-opacity='0.14'/%3E%3C/svg%3E")`;

/**
 * 8 Modern Form Background Patterns
 * Replaced clunky legacy 'waves' and 'triangles' with aesthetic 'crosses', 'topography', and 'stars'.
 */
export const FORM_BACKGROUND_PATTERNS: FormPatternOption[] = [
  {
    id: 'none',
    label: 'None',
    previewStyle: {
      backgroundColor: '#f1f5f9',
    },
  },
  {
    id: 'dots',
    label: 'Dots',
    previewStyle: {
      backgroundImage: 'radial-gradient(circle, #00000040 1px, transparent 1px)',
      backgroundSize: '10px 10px',
    },
  },
  {
    id: 'grid',
    label: 'Grid',
    previewStyle: {
      backgroundImage:
        'linear-gradient(#00000020 1px, transparent 1px), linear-gradient(90deg, #00000020 1px, transparent 1px)',
      backgroundSize: '16px 16px',
    },
  },
  {
    id: 'diagonal',
    label: 'Diagonal',
    previewStyle: {
      backgroundImage:
        'repeating-linear-gradient(45deg, transparent, transparent 8px, #00000015 8px, #00000015 9px)',
    },
  },
  {
    id: 'crosses',
    label: 'Crosses',
    previewStyle: {
      backgroundImage: CROSSES_SVG_URI,
      backgroundSize: '16px 16px',
    },
  },
  {
    id: 'circles',
    label: 'Circles',
    previewStyle: {
      backgroundImage: 'radial-gradient(circle at center, #00000040 1.5px, transparent 1.5px)',
      backgroundSize: '18px 18px',
    },
  },
  {
    id: 'topography',
    label: 'Topography',
    previewStyle: {
      backgroundImage: TOPOGRAPHY_SVG_URI,
      backgroundSize: '40px 40px',
    },
  },
  {
    id: 'stars',
    label: 'Stars',
    previewStyle: {
      backgroundImage: STARS_SVG_URI,
      backgroundSize: '32px 32px',
    },
  },
];

/**
 * Computes CSS properties (backgroundImage, backgroundSize) for the public form canvas.
 * Includes graceful backward-compatibility for legacy 'waves' and 'triangles'.
 */
export function getFormPatternStyle(pattern?: BackgroundPattern | string | null): CSSProperties {
  if (!pattern || pattern === 'none') {
    return {};
  }

  // Graceful fallback for legacy database values
  const normalizedPattern =
    pattern === 'waves'
      ? 'topography'
      : pattern === 'triangles'
        ? 'crosses'
        : pattern;

  switch (normalizedPattern) {
    case 'dots':
      return {
        backgroundImage: 'radial-gradient(circle, #00000040 1px, transparent 1px)',
        backgroundSize: '12px 12px',
      };
    case 'grid':
      return {
        backgroundImage:
          'linear-gradient(#00000020 1px, transparent 1px), linear-gradient(90deg, #00000020 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      };
    case 'diagonal':
      return {
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent, transparent 10px, #00000015 10px, #00000015 11px)',
      };
    case 'crosses':
      return {
        backgroundImage: CROSSES_SVG_URI,
        backgroundSize: '24px 24px',
      };
    case 'circles':
      return {
        backgroundImage: 'radial-gradient(circle at center, #00000040 2px, transparent 2px)',
        backgroundSize: '24px 24px',
      };
    case 'topography':
      return {
        backgroundImage: TOPOGRAPHY_SVG_URI,
        backgroundSize: '80px 80px',
      };
    case 'stars':
      return {
        backgroundImage: STARS_SVG_URI,
        backgroundSize: '48px 48px',
      };
    default:
      return {};
  }
}
