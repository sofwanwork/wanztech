import { describe, it, expect } from 'vitest';
import { getProgramFontSize } from '@/components/certificates/types';

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
