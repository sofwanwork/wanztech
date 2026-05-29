import { describe, it, expect } from 'vitest';

/**
 * Mirrors the CSV/formula injection guard inside
 * `lib/api/google-sheets.ts` (sanitizedData block).
 *
 * Any change to the guard there should be reflected here.
 */
function sanitizeForSheet(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (s.startsWith('=') || s.startsWith('+') || s.startsWith('-') || s.startsWith('@')) {
    s = "'" + s;
  }
  return s;
}

describe('Google Sheet CSV/formula injection guard', () => {
  it('prefixes formulas starting with =', () => {
    expect(sanitizeForSheet('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
  });

  it('prefixes formulas starting with +', () => {
    expect(sanitizeForSheet('+1+1')).toBe("'+1+1");
  });

  it('prefixes formulas starting with -', () => {
    expect(sanitizeForSheet('-DDE("cmd";"calc";"a")')).toBe('\'-DDE("cmd";"calc";"a")');
  });

  it('prefixes mentions starting with @', () => {
    expect(sanitizeForSheet('@SUM')).toBe("'@SUM");
  });

  it('leaves benign strings untouched', () => {
    expect(sanitizeForSheet('Hello World')).toBe('Hello World');
    expect(sanitizeForSheet('John Doe 123')).toBe('John Doe 123');
  });

  it('coerces non-string scalar types', () => {
    expect(sanitizeForSheet(42)).toBe('42');
    expect(sanitizeForSheet(true)).toBe('true');
  });

  it('coerces null/undefined to empty string', () => {
    expect(sanitizeForSheet(null)).toBe('');
    expect(sanitizeForSheet(undefined)).toBe('');
  });

  it('does not double-escape if value is non-malicious but starts with similar char', () => {
    // Numeric strings starting with - are still candidates for formula injection.
    // The guard treats them defensively, which is acceptable behaviour.
    expect(sanitizeForSheet('-5')).toBe("'-5");
  });
});
