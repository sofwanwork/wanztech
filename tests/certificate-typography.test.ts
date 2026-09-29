import { describe, it, expect } from 'vitest';
import { getProgramFontSize, getNameFontSize, isShortName } from '@/components/certificates/types';

describe('getProgramFontSize', () => {
  it('returns base size for short titles (<28 chars)', () => {
    expect(getProgramFontSize('KURSUS KEPIMPINAN 2026', 40)).toBe(40);
    expect(getProgramFontSize('WEBINAR AI', 44)).toBe(44);
  });

  it('scales down for medium length titles', () => {
    const size = getProgramFontSize('KURSUS PENGURUSAN SUMBER MANUSIA 2026', 40);
    expect(size).toBeLessThan(40);
    expect(size).toBe(30); // 40 * 0.75 = 30
  });

  it('scales down for 2-line titles', () => {
    const size = getProgramFontSize('KURSUS KEPIMPINAN\nSEKTOR AWAM 2026', 40);
    expect(size).toBeLessThan(40);
    expect(size).toBe(30); // 40 * 0.75 = 30
  });

  it('scales down further for very long titles (80+ chars or 3+ lines)', () => {
    const longTitle =
      'BENGKEL PENINGKATAN KEMAHIRAN DIGITAL & PENGURUSAN DATA LANJUTAN SEKTOR AWAM TAHUN 2026';
    const size = getProgramFontSize(longTitle, 40);
    expect(size).toBe(23); // 40 * 0.58 = 23.2 -> 23
  });

  it('handles null, undefined and empty strings gracefully', () => {
    expect(getProgramFontSize(null, 40)).toBe(40);
    expect(getProgramFontSize(undefined, 40)).toBe(40);
    expect(getProgramFontSize('', 40)).toBe(40);
    expect(getProgramFontSize('   ', 40)).toBe(40);
  });
});

describe('isShortName', () => {
  it('identifies short names (<= 28 chars) as 1-line candidates', () => {
    expect(isShortName('SOFWAN BIN MOHD JAILANI')).toBe(true); // 23 chars
    expect(isShortName('AHMAD BIN ALI')).toBe(true); // 13 chars
    expect(isShortName('SITI AISHAH')).toBe(true); // 11 chars
    expect(isShortName('NURUL HUDA BINTI ISMAIL')).toBe(true); // 23 chars
    expect(isShortName('CHONG WEI HONG')).toBe(true); // 14 chars
  });

  it('identifies long names (> 28 chars) as multi-line candidates', () => {
    expect(isShortName('MUHAMMAD DANIAL HAZIQ BIN ABDUL RAHMAN')).toBe(false); // 38 chars
    expect(isShortName('WAN MUHAMMAD AMIRUL ASYRAF BIN WAN MOHAMAD')).toBe(false); // 42 chars
    expect(isShortName('DATO\' SERI DR. HAJI MOHAMAD AZLAN BIN TAN SRI ABDUL MAJID')).toBe(false); // 57 chars
  });

  it('identifies names with explicit newline as multi-line', () => {
    expect(isShortName('SOFWAN BIN\nMOHD JAILANI')).toBe(false);
  });

  it('handles empty or null gracefully', () => {
    expect(isShortName(null)).toBe(true);
    expect(isShortName(undefined)).toBe(true);
    expect(isShortName('')).toBe(true);
  });
});

describe('getNameFontSize', () => {
  it('preserves base size for short names like SOFWAN BIN MOHD JAILANI', () => {
    expect(getNameFontSize('SOFWAN BIN MOHD JAILANI', 46)).toBe(46);
    expect(getNameFontSize('AHMAD BIN ALI', 46)).toBe(46);
  });

  it('clamps excessively large base size (> 52px) for medium-short names to prevent 1-line overflow', () => {
    expect(getNameFontSize('SOFWAN BIN MOHD JAILANI', 60)).toBe(52);
  });

  it('scales down for medium-long names (29-43 chars) to fit 2 lines', () => {
    const size = getNameFontSize('MUHAMMAD DANIAL HAZIQ BIN ABDUL RAHMAN', 46);
    expect(size).toBe(36); // 46 * 0.78 = 35.88 -> 36
    expect(size).toBeLessThan(46);
  });

  it('scales down further for very long names (44+ chars) to strictly fit within 2 lines max', () => {
    const longName = 'DATO\' SERI DR. HAJI MOHAMAD AZLAN BIN TAN SRI ABDUL MAJID';
    const size = getNameFontSize(longName, 46);
    expect(size).toBe(29); // 46 * 0.62 = 28.52 -> 29
    expect(size).toBeGreaterThanOrEqual(18);
  });

  it('handles null, undefined and whitespace gracefully', () => {
    expect(getNameFontSize(null, 46)).toBe(46);
    expect(getNameFontSize(undefined, 46)).toBe(46);
    expect(getNameFontSize('', 46)).toBe(46);
    expect(getNameFontSize('   ', 46)).toBe(46);
  });
});

