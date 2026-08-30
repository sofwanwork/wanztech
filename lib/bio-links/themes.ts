import { BioTheme, BioButtonStyle, BioSocialLinks } from '@/lib/types/bio-links';

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
  'outline': { name: 'Outline Border', class: 'border-2 bg-transparent backdrop-blur-sm' },
  'shadow-lg': { name: 'Elevated Shadow', class: 'rounded-xl shadow-xl' },
  'glass': { name: 'Glassmorphism', class: 'rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20' },
};

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
