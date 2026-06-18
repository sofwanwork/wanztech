import { describe, it, expect } from 'vitest';
import { isIcHeader } from '@/lib/certificates/headers';

describe('isIcHeader', () => {
  it('matches standard IC variations', () => {
    expect(isIcHeader('ic')).toBe(true);
    expect(isIcHeader('no ic')).toBe(true);
    expect(isIcHeader('no. ic')).toBe(true);
    expect(isIcHeader('no.ic')).toBe(true);
    expect(isIcHeader('ic number')).toBe(true);
  });

  it('matches NRIC variations', () => {
    expect(isIcHeader('nric')).toBe(true);
    expect(isIcHeader('nric number')).toBe(true);
    expect(isIcHeader('No. NRIC')).toBe(true);
  });

  it('matches Kad Pengenalan variations', () => {
    expect(isIcHeader('kad pengenalan')).toBe(true);
    expect(isIcHeader('No. Kad Pengenalan')).toBe(true);
    expect(isIcHeader('Nombor Kad Pengenalan')).toBe(true);
  });

  it('matches KP (Kad Pengenalan abbreviation) variations', () => {
    expect(isIcHeader('kp')).toBe(true);
    expect(isIcHeader('no kp')).toBe(true);
    expect(isIcHeader('no. kp')).toBe(true);
    expect(isIcHeader('no.kp')).toBe(true);
    expect(isIcHeader('nombor kp')).toBe(true);
    expect(isIcHeader('KP/Passport')).toBe(true);
    expect(isIcHeader('No. KP/Pasport')).toBe(true);
  });

  it('matches IC word boundaries', () => {
    expect(isIcHeader('IC/Passport')).toBe(true);
    expect(isIcHeader('No. IC/Pasport')).toBe(true);
  });

  it('does not match unrelated columns containing ic or kp letters', () => {
    expect(isIcHeader('nama')).toBe(false);
    expect(isIcHeader('email')).toBe(false);
    expect(isIcHeader('telefon')).toBe(false);
    expect(isIcHeader('office')).toBe(false); // contains "ic" but not as word boundary
    expect(isIcHeader('participation')).toBe(false); // contains "ic" but not as word boundary
    expect(isIcHeader('service')).toBe(false); // contains "ic" but not as word boundary
    expect(isIcHeader('music')).toBe(false); // contains "ic" but not as word boundary
    expect(isIcHeader('remark')).toBe(false);
    expect(isIcHeader('timestamp')).toBe(false);
  });
});
