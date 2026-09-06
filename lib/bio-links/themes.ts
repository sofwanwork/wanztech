import type React from 'react';
import { BioTheme, BioButtonStyle, BioSocialLinks, BioPattern } from '@/lib/types/bio-links';

export interface ThemeDefinition {
  id: BioTheme;
  name: string;
  description: string;
  bg: string;
  textColor: string;
  bioColor: string;
  buttonClass: string;
  highlightButtonClass: string;
  avatarBorder: string;
  cardBg: string;
  previewColor: string; // for color badge in theme selector
}

export const BIO_THEMES: Record<BioTheme, ThemeDefinition> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Luxe',
    description: 'KlikForm signature emerald green gradient',
    bg: 'bg-gradient-to-b from-emerald-950 via-teal-900 to-emerald-900',
    textColor: 'text-white',
    bioColor: 'text-emerald-200/80',
    buttonClass: 'bg-white/10 hover:bg-white/20 text-white border border-emerald-500/30 backdrop-blur-md shadow-lg shadow-emerald-950/50',
    highlightButtonClass: 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/30',
    avatarBorder: 'ring-4 ring-emerald-400/40',
    cardBg: 'bg-emerald-900/40 border border-emerald-500/20',
    previewColor: '#059669',
  },
  dark: {
    id: 'dark',
    name: 'Onyx Dark',
    description: 'Sleek dark charcoal and neutral tones',
    bg: 'bg-gradient-to-b from-zinc-950 via-neutral-900 to-zinc-900',
    textColor: 'text-white',
    bioColor: 'text-zinc-400',
    buttonClass: 'bg-zinc-800/80 hover:bg-zinc-700/80 text-white border border-zinc-700/60 shadow-md shadow-black/40',
    highlightButtonClass: 'bg-white text-zinc-950 font-semibold shadow-lg shadow-white/10',
    avatarBorder: 'ring-4 ring-zinc-700',
    cardBg: 'bg-zinc-900/80 border border-zinc-800',
    previewColor: '#27272a',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Vibrant sunset rose and warm amber gradient',
    bg: 'bg-gradient-to-br from-amber-600 via-rose-600 to-purple-900',
    textColor: 'text-white',
    bioColor: 'text-amber-100/90',
    buttonClass: 'bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md shadow-lg shadow-rose-950/40',
    highlightButtonClass: 'bg-white text-rose-700 font-semibold shadow-lg shadow-rose-900/40',
    avatarBorder: 'ring-4 ring-amber-300/60',
    cardBg: 'bg-rose-900/30 border border-white/20',
    previewColor: '#e11d48',
  },
  ocean: {
    id: 'ocean',
    name: 'Deep Ocean',
    description: 'Calm deep sea and cyan sky gradient',
    bg: 'bg-gradient-to-b from-sky-950 via-blue-950 to-slate-950',
    textColor: 'text-white',
    bioColor: 'text-sky-200/80',
    buttonClass: 'bg-blue-900/30 hover:bg-blue-800/40 text-white border border-sky-400/30 backdrop-blur-md shadow-lg shadow-sky-950/50',
    highlightButtonClass: 'bg-gradient-to-r from-sky-400 to-blue-500 text-slate-950 font-semibold shadow-lg shadow-sky-500/30',
    avatarBorder: 'ring-4 ring-sky-400/50',
    cardBg: 'bg-blue-950/40 border border-sky-500/20',
    previewColor: '#0284c7',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Light',
    description: 'Clean, modern white and slate design',
    bg: 'bg-slate-100',
    textColor: 'text-slate-900',
    bioColor: 'text-slate-600',
    buttonClass: 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 shadow-sm',
    highlightButtonClass: 'bg-slate-900 text-white font-semibold shadow-md shadow-slate-900/20 hover:bg-slate-800',
    avatarBorder: 'ring-4 ring-slate-300',
    cardBg: 'bg-white border border-slate-200',
    previewColor: '#e2e8f0',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender Dusk',
    description: 'Dreamy soft purple and violet gradient',
    bg: 'bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-950',
    textColor: 'text-white',
    bioColor: 'text-purple-200/80',
    buttonClass: 'bg-purple-900/30 hover:bg-purple-800/40 text-white border border-purple-400/30 backdrop-blur-md shadow-lg shadow-purple-950/50',
    highlightButtonClass: 'bg-gradient-to-r from-purple-400 to-pink-400 text-slate-950 font-semibold shadow-lg shadow-purple-500/30',
    avatarBorder: 'ring-4 ring-purple-400/50',
    cardBg: 'bg-purple-950/40 border border-purple-500/20',
    previewColor: '#9333ea',
  },
  neon: {
    id: 'neon',
    name: 'Cyber Neon',
    description: 'High-contrast cyberpunk glow effect',
    bg: 'bg-black',
    textColor: 'text-emerald-400',
    bioColor: 'text-emerald-200/70',
    buttonClass: 'bg-zinc-950 hover:bg-zinc-900 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    highlightButtonClass: 'bg-emerald-400 text-black font-bold shadow-[0_0_20px_rgba(52,211,153,0.5)]',
    avatarBorder: 'ring-4 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    cardBg: 'bg-zinc-950 border border-emerald-500/30',
    previewColor: '#10b981',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Gold',
    description: 'Prestigious navy blue with luxury gold accents',
    bg: 'bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950',
    textColor: 'text-amber-100',
    bioColor: 'text-amber-200/70',
    buttonClass: 'bg-slate-900/80 hover:bg-slate-800 text-amber-200 border border-amber-500/30 shadow-lg shadow-black/40',
    highlightButtonClass: 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20',
    avatarBorder: 'ring-4 ring-amber-400/60',
    cardBg: 'bg-slate-900/60 border border-amber-500/20',
    previewColor: '#d97706',
  },
};

export const BUTTON_STYLES: Record<BioButtonStyle, { name: string; class: string }> = {
  'rounded-full': { name: 'Full Pill', class: 'rounded-full' },
  'rounded-xl': { name: 'Rounded XL', class: 'rounded-2xl' },
  'rounded-md': { name: 'Subtle Round', class: 'rounded-md' },
  'outline': { name: 'Outline Border', class: 'rounded-2xl border-2 bg-transparent backdrop-blur-sm' },
  'shadow-lg': { name: 'Elevated Shadow', class: 'rounded-xl shadow-xl' },
  'glass': { name: 'Glassmorphism', class: 'rounded-2xl backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm' },
};

/**
 * Resolves the complete CSS class for bio link buttons based on theme, button shape/style, and highlight status.
 * Ensures text remains high-contrast and legible across all light/dark themes and translucent styles like Glassmorphism.
 */
export function getBioButtonClass(
  theme: ThemeDefinition | BioTheme,
  buttonStyle: BioButtonStyle = 'rounded-full',
  isHighlight = false
): string {
  const themeDef = typeof theme === 'string' ? BIO_THEMES[theme] || BIO_THEMES.emerald : theme;
  const isLight = themeDef.id === 'minimal';
  const baseShape = BUTTON_STYLES[buttonStyle]?.class || BUTTON_STYLES['rounded-full'].class;

  // 1. Glassmorphism button style
  if (buttonStyle === 'glass') {
    if (isLight) {
      if (isHighlight) {
        return 'rounded-2xl backdrop-blur-xl bg-white/90 hover:bg-white text-slate-950 font-bold border-2 border-slate-900/30 shadow-md ring-2 ring-slate-900/10';
      }
      return 'rounded-2xl backdrop-blur-xl bg-white/70 hover:bg-white/85 text-slate-900 font-medium border border-white/80 shadow-sm';
    }

    if (isHighlight) {
      const highlightText =
        themeDef.id === 'neon'
          ? 'text-emerald-300 border-emerald-400/60 ring-emerald-400/20'
          : themeDef.id === 'midnight'
          ? 'text-amber-200 border-amber-400/60 ring-amber-400/20'
          : 'text-white border-white/40 ring-white/20';

      return `rounded-2xl backdrop-blur-xl bg-white/20 hover:bg-white/25 ${highlightText} font-bold border-2 shadow-xl shadow-black/30 ring-2`;
    }

    const glassTextColor =
      themeDef.id === 'neon'
        ? 'text-emerald-300'
        : themeDef.id === 'midnight'
        ? 'text-amber-200'
        : 'text-white';

    return `rounded-2xl backdrop-blur-xl bg-white/10 hover:bg-white/20 ${glassTextColor} font-medium border border-white/20 shadow-lg`;
  }

  // 2. Outline Border button style
  if (buttonStyle === 'outline') {
    if (isLight) {
      if (isHighlight) {
        return 'rounded-2xl border-2 backdrop-blur-sm bg-slate-900/10 hover:bg-slate-900/15 text-slate-950 font-bold border-slate-900 shadow-sm';
      }
      return 'rounded-2xl border-2 backdrop-blur-sm bg-transparent hover:bg-slate-900/5 text-slate-900 font-medium border-slate-300 hover:border-slate-400 shadow-sm';
    }

    if (isHighlight) {
      const outlineHighlightColor =
        themeDef.id === 'neon'
          ? 'text-emerald-300 border-emerald-400'
          : themeDef.id === 'midnight'
          ? 'text-amber-200 border-amber-400'
          : 'text-white border-white';

      return `rounded-2xl border-2 backdrop-blur-sm bg-white/15 hover:bg-white/25 ${outlineHighlightColor} font-bold shadow-lg shadow-white/10`;
    }

    const outlineColor =
      themeDef.id === 'neon'
        ? 'text-emerald-300 border-emerald-500/50 hover:border-emerald-400'
        : themeDef.id === 'midnight'
        ? 'text-amber-200 border-amber-500/40 hover:border-amber-400'
        : 'text-white border-white/30 hover:border-white/50';

    return `rounded-2xl border-2 backdrop-blur-sm bg-transparent hover:bg-white/10 font-medium ${outlineColor} shadow-sm`;
  }

  // 3. Standard button styles (Full Pill, Rounded XL, Subtle Round, Elevated Shadow)
  const themeClass = isHighlight ? themeDef.highlightButtonClass : themeDef.buttonClass;
  return `${baseShape} ${themeClass}`;
}

/**
 * Validate username format for Bio Links
 * Allowed: 3-30 characters, alphanumeric, hyphens, underscores.
 */
export function isValidBioUsername(username: string): boolean {
  if (!username) return false;
  const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;
  return USERNAME_REGEX.test(username.toLowerCase());
}

/**
 * Clean and format a user-provided username
 */
export function cleanBioUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 30);
}

/**
 * Build destination URL for social links
 */
export function resolveSocialUrl(platform: keyof BioSocialLinks, value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  // If user provided a full URL, ensure it has protocol
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('mailto:')) {
    return trimmed;
  }

  // Otherwise format per platform
  switch (platform) {
    case 'whatsapp': {
      // Remove non-digit characters
      const cleanPhone = trimmed.replace(/[^0-9]/g, '');
      return `https://wa.me/${cleanPhone}`;
    }
    case 'instagram':
      return `https://instagram.com/${trimmed.replace(/^@/, '')}`;
    case 'tiktok':
      return `https://tiktok.com/@${trimmed.replace(/^@/, '')}`;
    case 'facebook':
      return `https://facebook.com/${trimmed}`;
    case 'twitter':
      return `https://x.com/${trimmed.replace(/^@/, '')}`;
    case 'youtube':
      return trimmed.startsWith('@') ? `https://youtube.com/${trimmed}` : `https://youtube.com/@${trimmed}`;
    case 'telegram':
      return `https://t.me/${trimmed.replace(/^@/, '')}`;
    case 'github':
      return `https://github.com/${trimmed}`;
    case 'linkedin':
      return `https://linkedin.com/in/${trimmed}`;
    case 'email':
      return `mailto:${trimmed}`;
    case 'website':
      return `https://${trimmed}`;
    default:
      return `https://${trimmed}`;
  }
}

export interface BioPatternDefinition {
  id: BioPattern;
  name: string;
  description: string;
}

export const BIO_PATTERNS: Record<BioPattern, BioPatternDefinition> = {
  none: {
    id: 'none',
    name: 'None',
    description: 'Plain theme background without texture',
  },
  dots: {
    id: 'dots',
    name: 'Polka Dots',
    description: 'Subtle dotted grid pattern',
  },
  grid: {
    id: 'grid',
    name: 'Modern Grid',
    description: 'Clean architectural line grid',
  },
  stripes: {
    id: 'stripes',
    name: 'Diagonal Stripes',
    description: 'Dynamic diagonal stripe lines',
  },
  waves: {
    id: 'waves',
    name: 'Topography Waves',
    description: 'Curved contour line waves',
  },
  crosses: {
    id: 'crosses',
    name: 'Minimal Crosses',
    description: 'Delicate geometric plus markers',
  },
  stars: {
    id: 'stars',
    name: 'Starry Sparkles',
    description: 'Sparkling celestial star dots',
  },
  circuit: {
    id: 'circuit',
    name: 'Tech Circuit',
    description: 'Futuristic digital board lines',
  },
};

/**
 * Generates pure CSS / SVG data URI background styles for KlikBio patterns.
 * Adapts stroke/fill colors intelligently based on theme brightness to guarantee optimal contrast.
 */
export function getBioPatternStyle(
  pattern: BioPattern = 'none',
  theme: ThemeDefinition | BioTheme = 'emerald'
): React.CSSProperties {
  if (!pattern || pattern === 'none') {
    return {};
  }

  const themeDef = typeof theme === 'string' ? BIO_THEMES[theme] || BIO_THEMES.emerald : theme;
  const isLight = themeDef.id === 'minimal';

  switch (pattern) {
    case 'dots': {
      const dotColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.12)';
      return {
        backgroundImage: `radial-gradient(${dotColor} 1.5px, transparent 1.5px)`,
        backgroundSize: '20px 20px',
      };
    }
    case 'grid': {
      const gridColor = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.07)';
      return {
        backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      };
    }
    case 'stripes': {
      const stripeColor = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.06)';
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${stripeColor}, ${stripeColor} 2px, transparent 2px, transparent 14px)`,
      };
    }
    case 'waves': {
      const stroke = isLight ? 'rgba(15, 23, 42, 0.07)' : 'rgba(255, 255, 255, 0.09)';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><path d="M0 20 Q 20 5, 40 20 T 80 20 M0 60 Q 20 45, 40 60 T 80 60" fill="none" stroke="${stroke}" stroke-width="1.5"/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundSize: '80px 80px',
      };
    }
    case 'crosses': {
      const stroke = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.12)';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M16 20h8M20 16v8" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundSize: '40px 40px',
      };
    }
    case 'stars': {
      const fill = isLight ? 'rgba(15, 23, 42, 0.09)' : 'rgba(255, 255, 255, 0.14)';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><path d="M30 16 Q 30 24 38 24 Q 30 24 30 32 Q 30 24 22 24 Q 30 24 30 16 Z M10 48 Q 10 52 14 52 Q 10 52 10 56 Q 10 52 6 52 Q 10 52 10 48 Z" fill="${fill}"/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundSize: '60px 60px',
      };
    }
    case 'circuit': {
      const stroke = isLight ? 'rgba(15, 23, 42, 0.07)' : 'rgba(255, 255, 255, 0.1)';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><path d="M0 32h20l8 8h16l8-8h12M32 0v16l-8 8v16l8 8v16" fill="none" stroke="${stroke}" stroke-width="1.2"/><circle cx="28" cy="40" r="2" fill="${stroke}"/><circle cx="24" cy="24" r="2" fill="${stroke}"/></svg>`;
      return {
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundSize: '64px 64px',
      };
    }
    default:
      return {};
  }
}
