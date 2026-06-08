import { describe, it, expect } from 'vitest';
import { generateCertSerial } from '@/lib/certificates/serial';

describe('generateCertSerial', () => {
  it('is deterministic — same inputs give the same code', () => {
    const a = generateCertSerial('form-1', '901234567890');
    const b = generateCertSerial('form-1', '901234567890');
    expect(a).toBe(b);
  });

  it('matches the SIJIL-XXXXXXXX format (8 hex chars)', () => {
    expect(generateCertSerial('form-1', '901234567890')).toMatch(/^SIJIL-[0-9A-F]{8}$/);
  });

  it('differs for a different form (program)', () => {
    expect(generateCertSerial('form-1', '901234567890')).not.toBe(
      generateCertSerial('form-2', '901234567890')
    );
  });

  it('differs for a different person', () => {
    expect(generateCertSerial('form-1', '901234567890')).not.toBe(
      generateCertSerial('form-1', '880101019999')
    );
  });

  it('normalizes case/whitespace of the identifier', () => {
    expect(generateCertSerial('form-1', '  ALI@EXAMPLE.COM ')).toBe(
      generateCertSerial('form-1', 'ali@example.com')
    );
  });

  it('returns empty when no identifier is given (no shared code)', () => {
    expect(generateCertSerial('form-1', '')).toBe('');
    expect(generateCertSerial('form-1', '   ')).toBe('');
  });
});
