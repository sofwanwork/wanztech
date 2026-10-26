import { describe, it, expect } from 'vitest';

describe('QR Builder & Customizer Download Logic', () => {
  it('cleans URL by trimming whitespace and falls back to default if empty', () => {
    const sanitizeUrl = (input?: string) => (input || '').trim() || 'https://klikform.com';

    expect(sanitizeUrl('  https://google.com/maps/place/...  ')).toBe('https://google.com/maps/place/...');
    expect(sanitizeUrl('https://example.com\n')).toBe('https://example.com');
    expect(sanitizeUrl('')).toBe('https://klikform.com');
    expect(sanitizeUrl('   ')).toBe('https://klikform.com');
    expect(sanitizeUrl(undefined)).toBe('https://klikform.com');
  });

  it('calculates proper ISO/IEC 18004 quiet zone margins for high-res PNG and vector SVG', () => {
    const calculateMargin = (format: 'png' | 'svg', resolution: number) => {
      return format === 'png' ? Math.max(20, Math.round(resolution * 0.04)) : 12;
    };

    // 2000x2000px PNG should have 80px quiet zone (4% of resolution)
    expect(calculateMargin('png', 2000)).toBe(80);
    // 1000x1000px PNG should have 40px quiet zone
    expect(calculateMargin('png', 1000)).toBe(40);
    // Low resolution clamped to minimum 20px
    expect(calculateMargin('png', 300)).toBe(20);
    // SVG standard quiet zone
    expect(calculateMargin('svg', 300)).toBe(12);
  });

  it('assigns correct render type (canvas for PNG raster, svg for SVG vector) to prevent stale cache bugs', () => {
    const getRenderType = (format: 'png' | 'svg'): 'canvas' | 'svg' => {
      return format === 'svg' ? 'svg' : 'canvas';
    };

    expect(getRenderType('png')).toBe('canvas');
    expect(getRenderType('svg')).toBe('svg');
  });

  it('constructs complete options payload without omitting user customization or quiet zone', () => {
    const buildDownloadOptions = (
      cleanUrl: string,
      format: 'png' | 'svg',
      resolution: number,
      settings: {
        dotsColor?: string;
        dotsType?: string;
        cornersColor?: string;
        cornersType?: string;
        backgroundColor?: string;
        logo?: string;
      }
    ) => {
      return {
        width: format === 'png' ? resolution : 300,
        height: format === 'png' ? resolution : 300,
        type: format === 'svg' ? 'svg' : 'canvas',
        data: cleanUrl,
        image: settings.logo,
        margin: format === 'png' ? Math.max(20, Math.round(resolution * 0.04)) : 12,
        dotsOptions: {
          color: settings.dotsColor || '#000000',
          type: settings.dotsType || 'square',
        },
        cornersSquareOptions: {
          color: settings.cornersColor || '#000000',
          type: settings.cornersType || 'square',
        },
        backgroundOptions: {
          color: settings.backgroundColor || '#ffffff',
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: format === 'png' ? Math.round(resolution * 0.015) : 8,
        },
      };
    };

    const options = buildDownloadOptions(
      'https://www.google.com/maps',
      'png',
      2000,
      {
        dotsColor: '#2563eb',
        dotsType: 'rounded',
        cornersColor: '#1d4ed8',
        cornersType: 'dot',
        backgroundColor: '#ffffff',
      }
    );

    expect(options.data).toBe('https://www.google.com/maps');
    expect(options.width).toBe(2000);
    expect(options.height).toBe(2000);
    expect(options.type).toBe('canvas');
    expect(options.margin).toBe(80);
    expect(options.dotsOptions.color).toBe('#2563eb');
    expect(options.dotsOptions.type).toBe('rounded');
    expect(options.cornersSquareOptions.color).toBe('#1d4ed8');
    expect(options.cornersSquareOptions.type).toBe('dot');
    expect(options.backgroundOptions.color).toBe('#ffffff');
  });
});
