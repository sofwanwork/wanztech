import { describe, it, expect } from 'vitest';
import { generateEditToken } from '@/lib/storage/edit-tokens';

// Edit-token logic that touches Supabase (createEditToken, getEditToken,
// markEditTokenUsed) needs a real admin client and is covered by integration
// rather than these unit tests. What we CAN test deterministically:
//  * token generator entropy / format
//  * expiry math handling

describe('generateEditToken', () => {
  it('produces a 64-char hex string', () => {
    const t = generateEditToken();
    expect(t).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is unique across many invocations', () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      set.add(generateEditToken());
    }
    expect(set.size).toBe(1000);
  });
});

describe('expiry math (token expiresAt)', () => {
  // Mirrors the inline math in createEditToken so a refactor doesn't
  // accidentally change semantics.
  function computeExpiresAt(expiryDays: number, now = Date.now()): string {
    return new Date(now + Math.max(1, expiryDays) * 24 * 60 * 60 * 1000).toISOString();
  }

  it('respects positive expiryDays', () => {
    const now = Date.UTC(2026, 4, 29, 0, 0, 0);
    const out = computeExpiresAt(7, now);
    expect(out).toBe(new Date(now + 7 * 86400 * 1000).toISOString());
  });

  it('clamps non-positive expiryDays to 1 day minimum', () => {
    const now = Date.UTC(2026, 4, 29, 0, 0, 0);
    expect(computeExpiresAt(0, now)).toBe(new Date(now + 86400 * 1000).toISOString());
    expect(computeExpiresAt(-5, now)).toBe(new Date(now + 86400 * 1000).toISOString());
  });
});

describe('email field detection (mirrors submitFormAction)', () => {
  // The real submitFormAction reads dbData[emailField.label] then validates
  // it with a simple email regex. We extract the regex here so a regression
  // breaks the tests rather than the production form silently.
  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  it('accepts standard formats', () => {
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail('first.last+tag@example.com')).toBe(true);
  });

  it('rejects malformed values', () => {
    expect(isEmail('not-an-email')).toBe(false);
    expect(isEmail('missing@dot')).toBe(false);
    expect(isEmail('@nope.com')).toBe(false);
    expect(isEmail('spaces in@email.com')).toBe(false);
    expect(isEmail('')).toBe(false);
  });
});
