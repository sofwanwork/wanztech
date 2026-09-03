import { describe, it, expect } from 'vitest';
import {
  isValidBioUsername,
  cleanBioUsername,
  resolveSocialUrl,
  BIO_THEMES,
  BUTTON_STYLES,
  getBioButtonClass,
} from '@/lib/bio-links/themes';
import { BioTheme, BioButtonStyle } from '@/lib/types/bio-links';

describe('KlikBio — Username Validation', () => {
  it('accepts valid usernames', () => {
    expect(isValidBioUsername('wan')).toBe(true);
    expect(isValidBioUsername('sofwan123')).toBe(true);
    expect(isValidBioUsername('wan-tech')).toBe(true);
    expect(isValidBioUsername('my_brand_99')).toBe(true);
    expect(isValidBioUsername('studio-2026_xyz')).toBe(true);
  });

  it('rejects invalid usernames', () => {
    expect(isValidBioUsername('')).toBe(false);
    expect(isValidBioUsername('ab')).toBe(false); // too short (<3)
    expect(isValidBioUsername('a'.repeat(35))).toBe(false); // too long (>30)
    expect(isValidBioUsername('wan tech')).toBe(false); // contains space
    expect(isValidBioUsername('wan@tech')).toBe(false); // contains @
    expect(isValidBioUsername('wan.tech')).toBe(false); // contains dot
    expect(isValidBioUsername('wan/tech')).toBe(false); // contains slash
  });

  it('cleans and normalizes raw input', () => {
    expect(cleanBioUsername('Wan Tech Studio')).toBe('wan-tech-studio');
    expect(cleanBioUsername('  @My_Brand!!  ')).toBe('my_brand');
    expect(cleanBioUsername('Hello World 123')).toBe('hello-world-123');
    expect(cleanBioUsername('a'.repeat(40)).length).toBe(30);
  });
});

describe('KlikBio — Social URL Resolver', () => {
  it('formats WhatsApp phone numbers correctly', () => {
    expect(resolveSocialUrl('whatsapp', '0123456789')).toBe('https://wa.me/0123456789');
    expect(resolveSocialUrl('whatsapp', '+6012-345 6789')).toBe('https://wa.me/60123456789');
    expect(resolveSocialUrl('whatsapp', 'https://wa.me/60123456789')).toBe('https://wa.me/60123456789');
  });

  it('formats Instagram handles correctly', () => {
    expect(resolveSocialUrl('instagram', 'sofwan')).toBe('https://instagram.com/sofwan');
    expect(resolveSocialUrl('instagram', '@sofwan')).toBe('https://instagram.com/sofwan');
    expect(resolveSocialUrl('instagram', 'https://instagram.com/sofwan')).toBe('https://instagram.com/sofwan');
  });

  it('formats TikTok handles correctly', () => {
    expect(resolveSocialUrl('tiktok', 'sofwan')).toBe('https://tiktok.com/@sofwan');
    expect(resolveSocialUrl('tiktok', '@sofwan')).toBe('https://tiktok.com/@sofwan');
  });

  it('formats other platforms correctly', () => {
    expect(resolveSocialUrl('facebook', 'mybrand')).toBe('https://facebook.com/mybrand');
    expect(resolveSocialUrl('twitter', 'mybrand')).toBe('https://x.com/mybrand');
    expect(resolveSocialUrl('telegram', 'mychat')).toBe('https://t.me/mychat');
    expect(resolveSocialUrl('github', 'wan-dev')).toBe('https://github.com/wan-dev');
    expect(resolveSocialUrl('linkedin', 'in/sofwan')).toBe('https://linkedin.com/in/in/sofwan');
    expect(resolveSocialUrl('email', 'hello@klikform.com')).toBe('mailto:hello@klikform.com');
    expect(resolveSocialUrl('website', 'klikform.com')).toBe('https://klikform.com');
    expect(resolveSocialUrl('website', 'https://klikform.com')).toBe('https://klikform.com');
  });

  it('returns empty string for empty input', () => {
    expect(resolveSocialUrl('whatsapp', '')).toBe('');
    expect(resolveSocialUrl('instagram', '   ')).toBe('');
  });
});

describe('KlikBio — Themes & Styles Definition', () => {
  const expectedThemes: BioTheme[] = [
    'emerald',
    'dark',
    'sunset',
    'ocean',
    'minimal',
    'lavender',
    'neon',
    'midnight',
  ];

  it('contains all 8 crafted themes', () => {
    for (const themeKey of expectedThemes) {
      const theme = BIO_THEMES[themeKey];
      expect(theme).toBeDefined();
      expect(theme.name).toBeTruthy();
      expect(theme.bg).toBeTruthy();
      expect(theme.textColor).toBeTruthy();
      expect(theme.buttonClass).toBeTruthy();
      expect(theme.highlightButtonClass).toBeTruthy();
      expect(theme.avatarBorder).toBeTruthy();
    }
  });

  it('contains all button style configurations', () => {
    const styles: BioButtonStyle[] = [
      'rounded-full',
      'rounded-xl',
      'rounded-md',
      'outline',
      'shadow-lg',
      'glass',
    ];

    for (const styleKey of styles) {
      const style = BUTTON_STYLES[styleKey];
      expect(style).toBeDefined();
      expect(style.name).toBeTruthy();
      expect(style.class).toBeTruthy();
    }
  });
});

describe('KlikBio — Button Class Generator & Contrast Guard', () => {
  it('prevents invisible white text on Minimal Light theme with Glassmorphism', () => {
    // Normal state
    const normalClass = getBioButtonClass('minimal', 'glass', false);
    expect(normalClass).toContain('backdrop-blur-xl');
    expect(normalClass).toContain('text-slate-900');
    expect(normalClass).not.toContain('text-white');

    // Highlighted state
    const highlightClass = getBioButtonClass('minimal', 'glass', true);
    expect(highlightClass).toContain('backdrop-blur-xl');
    expect(highlightClass).toContain('text-slate-950');
    expect(highlightClass).not.toContain('text-white');
  });

  it('prevents invisible white text on Minimal Light theme with Outline style', () => {
    const normalClass = getBioButtonClass('minimal', 'outline', false);
    expect(normalClass).toContain('text-slate-900');
    expect(normalClass).not.toContain('text-white');

    const highlightClass = getBioButtonClass('minimal', 'outline', true);
    expect(highlightClass).toContain('text-slate-950');
    expect(highlightClass).not.toContain('text-white');
  });

  it('renders high-contrast white text for dark themes with Glassmorphism', () => {
    const darkThemes: BioTheme[] = ['emerald', 'dark', 'sunset', 'ocean', 'lavender'];
    for (const themeId of darkThemes) {
      const normalClass = getBioButtonClass(themeId, 'glass', false);
      expect(normalClass).toContain('text-white');
      expect(normalClass).toContain('backdrop-blur-xl');

      const highlightClass = getBioButtonClass(themeId, 'glass', true);
      expect(highlightClass).toContain('text-white');
      expect(highlightClass).toContain('backdrop-blur-xl');
    }
  });

  it('renders theme-accent text for Cyber Neon and Midnight Gold with Glassmorphism', () => {
    const neonClass = getBioButtonClass('neon', 'glass', false);
    expect(neonClass).toContain('text-emerald-300');

    const midnightClass = getBioButtonClass('midnight', 'glass', false);
    expect(midnightClass).toContain('text-amber-200');
  });

  it('accepts both ThemeDefinition object and theme string identifier', () => {
    const fromString = getBioButtonClass('minimal', 'glass', false);
    const fromObj = getBioButtonClass(BIO_THEMES.minimal, 'glass', false);
    expect(fromString).toBe(fromObj);
  });

  it('applies standard button styles correctly with theme classes', () => {
    const fullPill = getBioButtonClass('minimal', 'rounded-full', false);
    expect(fullPill).toContain('rounded-full');
    expect(fullPill).toContain('text-slate-900');

    const roundedXl = getBioButtonClass('minimal', 'rounded-xl', false);
    expect(roundedXl).toContain('rounded-2xl');

    const shadowLg = getBioButtonClass('minimal', 'shadow-lg', false);
    expect(shadowLg).toContain('shadow-xl');
  });
});
