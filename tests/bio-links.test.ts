import { describe, it, expect } from 'vitest';
import {
  isValidBioUsername,
  cleanBioUsername,
  resolveSocialUrl,
  BIO_THEMES,
  BUTTON_STYLES,
  BIO_PATTERNS,
  getBioButtonClass,
  getBioButtonCustomStyle,
  BIO_BUTTON_PRESETS,
  getBioPatternStyle,
  getBioPatternOpacity,
  formatHandleTiles,
  getBioDisplayHandle,
  getHeroFadeMask,
} from '@/lib/bio-links/themes';
import { BioTheme, BioButtonStyle, BioPattern, BioFadeStyle, BioThemeConfig } from '@/lib/types/bio-links';

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
    // URL percent-encoded parameter support
    expect(cleanBioUsername('%40metmalaysia')).toBe('metmalaysia');
    expect(cleanBioUsername('%40FIK2026')).toBe('fik2026');
    expect(cleanBioUsername('@fik2026')).toBe('fik2026');
    expect(cleanBioUsername('@@@triple_at')).toBe('triple_at');
    expect(cleanBioUsername('%20%40spaced_handle%20')).toBe('spaced_handle');
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
    'sky',
  ];

  it('contains all 9 crafted themes', () => {
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

  it('guarantees optimal readability on Sky Breeze theme with Frosted Glass and Outline', () => {
    // Normal glass (Frosted pill with dark bold text like Linktree FIK2026)
    const skyGlassNormal = getBioButtonClass('sky', 'glass', false);
    expect(skyGlassNormal).toContain('backdrop-blur-xl');
    expect(skyGlassNormal).toContain('text-slate-950');
    expect(skyGlassNormal).toContain('rounded-full');

    // Highlighted glass (Solid white with bold black text)
    const skyGlassHighlight = getBioButtonClass('sky', 'glass', true);
    expect(skyGlassHighlight).toContain('text-slate-950');
    expect(skyGlassHighlight).toContain('bg-white');

    // Outline (Crisp white border with high contrast white text on slate blue)
    const skyOutlineNormal = getBioButtonClass('sky', 'outline', false);
    expect(skyOutlineNormal).toContain('text-white');
    expect(skyOutlineNormal).toContain('border-white/60');

    const skyOutlineHighlight = getBioButtonClass('sky', 'outline', true);
    expect(skyOutlineHighlight).toContain('text-slate-950');
    expect(skyOutlineHighlight).toContain('bg-white');
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

describe('KlikBio — Background Patterns & Contrast Generator', () => {
  const expectedPatterns: BioPattern[] = [
    'none',
    'dots',
    'grid',
    'stripes',
    'waves',
    'crosses',
    'stars',
    'circuit',
  ];

  it('contains all 8 background patterns', () => {
    for (const patternKey of expectedPatterns) {
      const pattern = BIO_PATTERNS[patternKey];
      expect(pattern).toBeDefined();
      expect(pattern.id).toBe(patternKey);
      expect(pattern.name).toBeTruthy();
      expect(pattern.description).toBeTruthy();
    }
  });

  it('returns an empty object when pattern is none or undefined', () => {
    expect(getBioPatternStyle('none', 'emerald')).toEqual({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getBioPatternStyle(undefined as any, 'emerald')).toEqual({});
  });

  it('generates background styles for all active patterns', () => {
    const activePatterns: BioPattern[] = [
      'dots',
      'grid',
      'stripes',
      'waves',
      'crosses',
      'stars',
      'circuit',
    ];

    for (const patternKey of activePatterns) {
      const style = getBioPatternStyle(patternKey, 'emerald');
      expect(style.backgroundImage).toBeTruthy();
      expect(typeof style.backgroundImage).toBe('string');
    }
  });

  it('adapts pattern colors for Minimal Light theme with dark ink contrast', () => {
    // Light theme (minimal) must use dark ink rgba (15, 23, 42)
    const dotsLight = getBioPatternStyle('dots', 'minimal');
    expect(dotsLight.backgroundImage).toContain('rgba(15, 23, 42');
    expect(dotsLight.backgroundSize).toBe('20px 20px');

    const gridLight = getBioPatternStyle('grid', 'minimal');
    expect(gridLight.backgroundImage).toContain('rgba(15, 23, 42');
    expect(gridLight.backgroundSize).toBe('24px 24px');

    const wavesLight = getBioPatternStyle('waves', 'minimal');
    expect(decodeURIComponent(wavesLight.backgroundImage as string)).toContain('rgba(15, 23, 42');
  });

  it('adapts pattern colors for dark/vibrant themes with white/bright ink contrast', () => {
    // Dark theme (emerald) must use white ink rgba (255, 255, 255)
    const dotsDark = getBioPatternStyle('dots', 'emerald');
    expect(dotsDark.backgroundImage).toContain('rgba(255, 255, 255');

    const gridDark = getBioPatternStyle('grid', 'dark');
    expect(gridDark.backgroundImage).toContain('rgba(255, 255, 255');

    const wavesDark = getBioPatternStyle('waves', 'sunset');
    expect(decodeURIComponent(wavesDark.backgroundImage as string)).toContain('rgba(255, 255, 255');
  });
});

describe('KlikBio — Letter Tiles Handle Formatter', () => {
  it('formats uppercase handle with individual tiles when input is uppercase', () => {
    const res = formatHandleTiles('FIK2026');
    expect(res.prefix).toBe('@');
    expect(res.tiles).toEqual(['F', 'I', 'K', '2', '0', '2', '6']);
  });

  it('preserves natural lowercase handle by default (no forced uppercase)', () => {
    const res = formatHandleTiles('metmalaysia');
    expect(res.prefix).toBe('@');
    expect(res.tiles).toEqual(['m', 'e', 't', 'm', 'a', 'l', 'a', 'y', 's', 'i', 'a']);
    expect(res.tiles.length).toBe(11);
  });

  it('transforms lowercase handle to uppercase when uppercase flag is true', () => {
    const res = formatHandleTiles('metmalaysia', true);
    expect(res.prefix).toBe('@');
    expect(res.tiles).toEqual(['M', 'E', 'T', 'M', 'A', 'L', 'A', 'Y', 'S', 'I', 'A']);
  });

  it('strips leading @ symbol and respects casing option', () => {
    const defaultRes = formatHandleTiles('@fik2026');
    expect(defaultRes.prefix).toBe('@');
    expect(defaultRes.tiles).toEqual(['f', 'i', 'k', '2', '0', '2', '6']);

    const upperRes = formatHandleTiles('@fik2026', true);
    expect(upperRes.prefix).toBe('@');
    expect(upperRes.tiles).toEqual(['F', 'I', 'K', '2', '0', '2', '6']);
  });

  it('preserves mixed-case handles (e.g. MetMalaysia) accurately', () => {
    const res = formatHandleTiles('MetMalaysia');
    expect(res.prefix).toBe('@');
    expect(res.tiles).toEqual(['M', 'e', 't', 'M', 'a', 'l', 'a', 'y', 's', 'i', 'a']);
  });

  it('handles empty input gracefully', () => {
    const res = formatHandleTiles('');
    expect(res.prefix).toBe('@');
    expect(res.tiles).toEqual([]);
  });
});

describe('KlikBio — Custom Handle Display Resolver (Mixed Case Support)', () => {
  it('returns custom handle with exact mixed casing when provided', () => {
    expect(getBioDisplayHandle('metmalaysia', 'MetMalaysia')).toBe('MetMalaysia');
    expect(getBioDisplayHandle('fik2026', 'FIK2026_Official')).toBe('FIK2026_Official');
  });

  it('strips leading @ symbol from custom handle', () => {
    expect(getBioDisplayHandle('metmalaysia', '@MetMalaysia')).toBe('MetMalaysia');
    expect(getBioDisplayHandle('metmalaysia', '@@@Met_Malaysia')).toBe('Met_Malaysia');
  });

  it('falls back to username when custom handle is undefined or empty', () => {
    expect(getBioDisplayHandle('metmalaysia', undefined)).toBe('metmalaysia');
    expect(getBioDisplayHandle('metmalaysia', '')).toBe('metmalaysia');
    expect(getBioDisplayHandle('metmalaysia', '   ')).toBe('metmalaysia');
  });

  it('strips leading @ from fallback username', () => {
    expect(getBioDisplayHandle('@metmalaysia', '')).toBe('metmalaysia');
  });
});

describe('KlikBio — Hero Fade Scrim Mask Generator', () => {
  it('returns balanced smooth scrim mask by default', () => {
    const mask = getHeroFadeMask();
    expect(mask).toContain('linear-gradient(to bottom');
    expect(mask).toContain('rgba(0,0,0,1) 0%');
    expect(mask).toContain('rgba(0,0,0,0) 100%');
    expect(mask).toContain('18%');
  });

  it('returns deep atmospheric fade mask for deep style', () => {
    const mask = getHeroFadeMask('deep');
    expect(mask).toContain('linear-gradient(to bottom');
    expect(mask).toContain('8%');
    expect(mask).toContain('rgba(0,0,0,0) 100%');
  });

  it('returns subtle lower fade mask for subtle style', () => {
    const mask = getHeroFadeMask('subtle');
    expect(mask).toContain('linear-gradient(to bottom');
    expect(mask).toContain('38%');
    expect(mask).toContain('rgba(0,0,0,0) 100%');
  });

  it('falls back to smooth style for undefined or invalid input', () => {
    const mask = getHeroFadeMask(undefined as unknown as BioFadeStyle);
    expect(mask).toBe(getHeroFadeMask('smooth'));
  });
});

describe('KlikBio — Button Colors & Custom Presets', () => {
  it('contains all 9 button color presets with required properties', () => {
    expect(BIO_BUTTON_PRESETS.length).toBe(9);

    const defaultPreset = BIO_BUTTON_PRESETS.find((p) => p.id === 'default');
    expect(defaultPreset).toBeDefined();
    expect(defaultPreset?.name).toBe('Theme Default');

    const glassPreset = BIO_BUTTON_PRESETS.find((p) => p.id === 'frosted-glass');
    expect(glassPreset).toBeDefined();
    expect(glassPreset?.buttonColor).toBe('rgba(255, 255, 255, 0.16)');
    expect(glassPreset?.buttonTextColor).toBe('#ffffff');

    const oceanPreset = BIO_BUTTON_PRESETS.find((p) => p.id === 'ocean-sky');
    expect(oceanPreset).toBeDefined();
    expect(oceanPreset?.buttonTextColor).toBe('#38bdf8');
  });

  it('returns empty style object when no custom button colors are set', () => {
    expect(getBioButtonCustomStyle(undefined, false)).toEqual({});
    expect(getBioButtonCustomStyle({}, false)).toEqual({});
    expect(getBioButtonCustomStyle({ buttonPreset: 'default' }, false)).toEqual({});
  });

  it('resolves custom normal button colors cleanly into inline style object', () => {
    const config: BioThemeConfig = {
      buttonColor: '#1e40af',
      buttonTextColor: '#ffffff',
      buttonBorderColor: '#60a5fa',
    };

    const style = getBioButtonCustomStyle(config, false);
    expect(style.backgroundColor).toBe('#1e40af');
    expect(style.color).toBe('#ffffff');
    expect(style.borderColor).toBe('#60a5fa');
  });

  it('resolves highlighted button colors when isHighlight is true', () => {
    const config: BioThemeConfig = {
      buttonColor: '#1e40af',
      buttonTextColor: '#ffffff',
      highlightButtonColor: '#fbbf24',
      highlightButtonTextColor: '#000000',
    };

    const normalStyle = getBioButtonCustomStyle(config, false);
    expect(normalStyle.backgroundColor).toBe('#1e40af');
    expect(normalStyle.color).toBe('#ffffff');

    const highlightStyle = getBioButtonCustomStyle(config, true);
    expect(highlightStyle.backgroundColor).toBe('#fbbf24');
    expect(highlightStyle.color).toBe('#000000');
    expect(highlightStyle.borderColor).toBeUndefined();
  });

  it('supports transparent and translucent rgba color values', () => {
    const config: BioThemeConfig = {
      buttonColor: 'rgba(255, 255, 255, 0.15)',
      buttonBorderColor: 'rgba(255, 255, 255, 0.4)',
      buttonTextColor: '#ffffff',
    };

    const style = getBioButtonCustomStyle(config, false);
    expect(style.backgroundColor).toBe('rgba(255, 255, 255, 0.15)');
    expect(style.borderColor).toBe('rgba(255, 255, 255, 0.4)');
    expect(style.color).toBe('#ffffff');
  });
});

describe('KlikBio — Background Pattern Opacity', () => {
  it('defaults to 1.0 (100% opacity) when themeConfig or patternOpacity is undefined', () => {
    expect(getBioPatternOpacity(undefined)).toBe(1);
    expect(getBioPatternOpacity({})).toBe(1);
    expect(getBioPatternOpacity({ pattern: 'dots' })).toBe(1);
  });

  it('correctly calculates fractional opacity for valid percentages', () => {
    expect(getBioPatternOpacity({ patternOpacity: 100 })).toBe(1.0);
    expect(getBioPatternOpacity({ patternOpacity: 75 })).toBe(0.75);
    expect(getBioPatternOpacity({ patternOpacity: 50 })).toBe(0.5);
    expect(getBioPatternOpacity({ patternOpacity: 25 })).toBe(0.25);
    expect(getBioPatternOpacity({ patternOpacity: 10 })).toBe(0.1);
  });

  it('safely clamps values below 10% to 0.1 and above 100% to 1.0', () => {
    expect(getBioPatternOpacity({ patternOpacity: 0 })).toBe(0.1);
    expect(getBioPatternOpacity({ patternOpacity: -20 })).toBe(0.1);
    expect(getBioPatternOpacity({ patternOpacity: 150 })).toBe(1.0);
    expect(getBioPatternOpacity({ patternOpacity: 500 })).toBe(1.0);
  });

  it('combines with getBioPatternStyle to create valid CSS style properties', () => {
    const config: BioThemeConfig = {
      pattern: 'dots',
      patternOpacity: 50,
    };
    const patternStyle = getBioPatternStyle(config.pattern, 'emerald');
    const opacity = getBioPatternOpacity(config);

    expect(patternStyle.backgroundImage).toContain('radial-gradient');
    expect(opacity).toBe(0.5);
  });
});


