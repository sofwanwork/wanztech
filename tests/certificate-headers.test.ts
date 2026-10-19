import { describe, it, expect } from 'vitest';
import { isIcHeader, isEmailHeader } from '@/lib/certificates/headers';

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
    expect(isIcHeader('timestamp')).toBe(false);
  });
});

describe('isEmailHeader', () => {
  it('matches standard email variations', () => {
    expect(isEmailHeader('email')).toBe(true);
    expect(isEmailHeader('e-mel')).toBe(true);
    expect(isEmailHeader('e-mail')).toBe(true);
    expect(isEmailHeader('emel')).toBe(true);
    expect(isEmailHeader('mail')).toBe(true);
  });

  it('matches compound Malaysian and English email headers', () => {
    expect(isEmailHeader('Email Address')).toBe(true);
    expect(isEmailHeader('Alamat Email')).toBe(true);
    expect(isEmailHeader('Alamat E-mel')).toBe(true);
    expect(isEmailHeader('Alamat Emel')).toBe(true);
    expect(isEmailHeader('Emel Peserta')).toBe(true);
    expect(isEmailHeader('User Email')).toBe(true);
    expect(isEmailHeader('E-mel / Email')).toBe(true);
  });

  it('handles case-insensitivity and whitespace padding', () => {
    expect(isEmailHeader('  EMAIL  ')).toBe(true);
    expect(isEmailHeader('E-MEL')).toBe(true);
    expect(isEmailHeader('  alamat emel  ')).toBe(true);
  });

  it('does not match unrelated columns', () => {
    expect(isEmailHeader('nama')).toBe(false);
    expect(isEmailHeader('no ic')).toBe(false);
    expect(isEmailHeader('no telefon')).toBe(false);
    expect(isEmailHeader('alamat rumah')).toBe(false);
    expect(isEmailHeader('jawatan')).toBe(false);
    expect(isEmailHeader('timestamp')).toBe(false);
  });
});
