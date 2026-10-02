/**
 * Type definitions for E-Pamphlet & Buku Program Digital
 */

export type PamphletDisplayMode = 'flipbook' | 'slide' | 'vertical';

export type PamphletTheme = 'dark' | 'light' | 'paper' | 'emerald';

export type PamphletOrientation = 'portrait' | 'landscape';

export type PamphletActionButtonType =
  | 'primary'
  | 'whatsapp'
  | 'download'
  | 'checkin'
  | 'cert'
  | 'link';

export interface PamphletActionButton {
  id: string;
  label: string;
  url: string;
  icon?: string;
  type?: PamphletActionButtonType;
}

export interface PamphletPageItem {
  id: string;
  pageNumber: number;
  title?: string;
  imageUrl: string;
  aspectRatio?: number; // width / height or height / width
  orientation?: PamphletOrientation;
}

export interface PamphletThemeConfig {
  bg: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
  shadow: string;
}

export interface Pamphlet {
  id: string;
  userId: string;
  slug: string;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  coverImage?: string;
  pdfUrl?: string;
  theme: PamphletTheme;
  displayMode: PamphletDisplayMode;
  orientation?: PamphletOrientation;
  pages: PamphletPageItem[];
  actionButtons: PamphletActionButton[];
  isActive: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}
