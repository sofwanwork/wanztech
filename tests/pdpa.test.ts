import { describe, it, expect } from 'vitest';
import {
  requiresPdpaConsent,
  isConsentGiven,
  isPdpaSubmissionAllowed,
} from '@/lib/forms/pdpa';

describe('requiresPdpaConsent', () => {
  it('is false when settings are undefined', () => {
    expect(requiresPdpaConsent(undefined)).toBe(false);
  });

  it('is false when disabled', () => {
    expect(requiresPdpaConsent({ enabled: false })).toBe(false);
  });

  it('is true when enabled', () => {
    expect(requiresPdpaConsent({ enabled: true })).toBe(true);
  });
});

describe('isConsentGiven', () => {
  it('accepts only the literal string "true"', () => {
    expect(isConsentGiven('true')).toBe(true);
  });

  it('rejects falsy / missing / other values', () => {
    expect(isConsentGiven(undefined)).toBe(false);
    expect(isConsentGiven(null)).toBe(false);
    expect(isConsentGiven('')).toBe(false);
    expect(isConsentGiven('false')).toBe(false);
    expect(isConsentGiven('TRUE')).toBe(false);
    expect(isConsentGiven('1')).toBe(false);
    expect(isConsentGiven(true)).toBe(true); // String(true) === 'true'
  });
});

describe('isPdpaSubmissionAllowed', () => {
  it('always allows when PDPA is not required', () => {
    expect(isPdpaSubmissionAllowed(undefined, undefined)).toBe(true);
    expect(isPdpaSubmissionAllowed({ enabled: false }, undefined)).toBe(true);
  });

  it('blocks when PDPA required but consent missing', () => {
    expect(isPdpaSubmissionAllowed({ enabled: true }, undefined)).toBe(false);
    expect(isPdpaSubmissionAllowed({ enabled: true }, 'false')).toBe(false);
  });

  it('allows when PDPA required and consent given', () => {
    expect(isPdpaSubmissionAllowed({ enabled: true }, 'true')).toBe(true);
  });
});
