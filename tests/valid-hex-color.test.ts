import { describe, it, expect } from 'vitest';
import { toValidHexColor } from '@/lib/utils';

describe('toValidHexColor', () => {
  it('should return fallback for transparent and CSS keywords', () => {
    expect(toValidHexColor('transparent')).toBe('#000000');
    expect(toValidHexColor('transparent', '#ffffff')).toBe('#ffffff');
    expect(toValidHexColor('none')).toBe('#000000');
    expect(toValidHexColor('inherit')).toBe('#000000');
    expect(toValidHexColor('initial')).toBe('#000000');
    expect(toValidHexColor('unset')).toBe('#000000');
  });

  it('should return fallback for null, undefined, and empty string', () => {
    expect(toValidHexColor('')).toBe('#000000');
    expect(toValidHexColor('   ')).toBe('#000000');
    expect(toValidHexColor(undefined)).toBe('#000000');
    expect(toValidHexColor(null)).toBe('#000000');
    expect(toValidHexColor(null, '#d97706')).toBe('#d97706');
  });

  it('should return fallback for arbitrary non-hex strings and rgb expressions', () => {
    expect(toValidHexColor('not-a-color')).toBe('#000000');
    expect(toValidHexColor('rgb(255, 255, 255)')).toBe('#000000');
    expect(toValidHexColor('rgba(0,0,0,0)')).toBe('#000000');
    expect(toValidHexColor('#xyz123')).toBe('#000000');
  });

  it('should preserve and normalize valid 6-digit hex colors to lowercase', () => {
    expect(toValidHexColor('#ffffff')).toBe('#ffffff');
    expect(toValidHexColor('#FFFFFF')).toBe('#ffffff');
    expect(toValidHexColor('#D97706')).toBe('#d97706');
    expect(toValidHexColor('#1a1a2e')).toBe('#1a1a2e');
    expect(toValidHexColor('  #00ff00  ')).toBe('#00ff00');
  });

  it('should expand 3-digit hex colors to full 6-digit format', () => {
    expect(toValidHexColor('#fff')).toBe('#ffffff');
    expect(toValidHexColor('#000')).toBe('#000000');
    expect(toValidHexColor('#f0a')).toBe('#ff00aa');
    expect(toValidHexColor('#F0A')).toBe('#ff00aa');
  });

  it('should strip alpha channel from 8-digit hex colors', () => {
    expect(toValidHexColor('#ffffff80')).toBe('#ffffff');
    expect(toValidHexColor('#d97706ff')).toBe('#d97706');
  });

  it('should format bare 3-digit and 6-digit hex strings without hash', () => {
    expect(toValidHexColor('ffffff')).toBe('#ffffff');
    expect(toValidHexColor('fff')).toBe('#ffffff');
    expect(toValidHexColor('1a1a2e')).toBe('#1a1a2e');
  });
});
