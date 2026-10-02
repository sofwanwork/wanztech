/**
 * Themes and configurations for E-Pamphlet & Buku Program Digital
 */

import { PamphletTheme } from '@/lib/types/pamphlets';

export const PAMPHLET_THEMES: Record<
  PamphletTheme,
  {
    name: string;
    description: string;
    bgClass: string;
    cardBg: string;
    textColor: string;
    accentColor: string;
    borderClass: string;
    toolbarBg: string;
  }
> = {
  dark: {
    name: 'Cinema Dark',
    description: 'Latar gelap sinematik baldu yang menonjolkan warna helaian pamphlet',
    bgClass: 'bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100',
    cardBg: 'bg-slate-900/90',
    textColor: 'text-slate-100',
    accentColor: '#38bdf8',
    borderClass: 'border-slate-800/80',
    toolbarBg: 'bg-slate-900/80 backdrop-blur-md border-slate-800 text-slate-200',
  },
  light: {
    name: 'Clean Studio',
    description: 'Latar terang galeri moden yang kemas, cerah dan profesional',
    bgClass: 'bg-gradient-to-b from-slate-100 via-slate-50 to-zinc-200 text-slate-900',
    cardBg: 'bg-white',
    textColor: 'text-slate-900',
    accentColor: '#2563eb',
    borderClass: 'border-slate-200',
    toolbarBg: 'bg-white/85 backdrop-blur-md border-slate-200 text-slate-800 shadow-sm',
  },
  paper: {
    name: 'Warm Ivory Paper',
    description: 'Rona kertas buku fizikal klasik dengan sentuhan warna sepia lembut',
    bgClass: 'bg-gradient-to-b from-amber-50/80 via-stone-100 to-stone-200 text-stone-900',
    cardBg: 'bg-[#faf8f5]',
    textColor: 'text-stone-900',
    accentColor: '#d97706',
    borderClass: 'border-stone-300',
    toolbarBg: 'bg-[#faf8f5]/90 backdrop-blur-md border-stone-300 text-stone-800 shadow-sm',
  },
  emerald: {
    name: 'Royal Emerald',
    description: 'Palet hijau zamrud KlikForm yang anggun dan berwibawa',
    bgClass: 'bg-gradient-to-b from-emerald-950 via-slate-950 to-emerald-950 text-emerald-50',
    cardBg: 'bg-emerald-950/80',
    textColor: 'text-emerald-50',
    accentColor: '#10b981',
    borderClass: 'border-emerald-800/60',
    toolbarBg: 'bg-emerald-950/85 backdrop-blur-md border-emerald-800/70 text-emerald-100 shadow-lg',
  },
};

export const DEFAULT_PAMPHLET_THEME: PamphletTheme = 'dark';
