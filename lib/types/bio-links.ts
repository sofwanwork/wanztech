/**
 * Type definitions for KlikBio (Linktree-style bio links)
 */

export type BioLinkType = 'link' | 'whatsapp' | 'form' | 'header' | 'divider';

export type BioTheme =
  | 'emerald'
  | 'dark'
  | 'sunset'
  | 'ocean'
  | 'minimal'
  | 'lavender'
  | 'neon'
  | 'midnight';

export type BioButtonStyle =
  | 'rounded-full'
  | 'rounded-xl'
  | 'rounded-md'
  | 'outline'
  | 'shadow-lg'
  | 'glass';

export interface BioThemeConfig {
  bgType?: 'preset' | 'color' | 'gradient';
  bgValue?: string;
  buttonStyle?: BioButtonStyle;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
}

export interface BioSocialLinks {
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  telegram?: string;
  github?: string;
  email?: string;
  website?: string;
  linkedin?: string;
}

export interface BioPage {
  id: string;
  userId: string;
  username: string;
  title: string;
  bio: string;
  avatarUrl: string;
  theme: BioTheme;
  themeConfig: BioThemeConfig;
  socialLinks: BioSocialLinks;
  isActive: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface BioLink {
  id: string;
  bioPageId: string;
  userId: string;
  type: BioLinkType;
  title: string;
  url: string;
  icon?: string;
  highlight: boolean;
  isActive: boolean;
  clicks: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface BioPageWithLinks extends BioPage {
  links: BioLink[];
}
