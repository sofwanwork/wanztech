import { describe, it, expect } from 'vitest';
import { TIER_LIMITS } from '@/lib/constants/subscription-tiers';

/**
 * Helper that mirrors the gating pattern used in
 * `lib/storage/forms.ts`, `lib/storage/short-links.ts`, etc.
 *
 * `-1` semantically means "unlimited" — never block.
 */
function canCreateMore(current: number, limit: number): boolean {
  if (limit === -1) return true;
  return current < limit;
}

describe('Tier limits — semantic correctness', () => {
  it('free tier numbers match published pricing copy', () => {
    expect(TIER_LIMITS.free.maxForms).toBe(5);
    expect(TIER_LIMITS.free.maxSubmissionsPerForm).toBe(3000);
    expect(TIER_LIMITS.free.maxCertificates).toBe(2);
    expect(TIER_LIMITS.free.maxQRCodes).toBe(5);
    expect(TIER_LIMITS.free.maxShortLinks).toBe(5);
    expect(TIER_LIMITS.free.maxBioPages).toBe(1);
  });

  it('pro & enterprise are unlimited (-1) across the board', () => {
    for (const tier of ['pro', 'enterprise'] as const) {
      const t = TIER_LIMITS[tier];
      expect(t.maxForms).toBe(-1);
      expect(t.maxSubmissionsPerForm).toBe(-1);
      expect(t.maxCertificates).toBe(-1);
      expect(t.maxQRCodes).toBe(-1);
      expect(t.maxShortLinks).toBe(-1);
      expect(t.maxBioPages).toBe(-1);
    }
  });
});

describe('Tier gating — canCreateMore()', () => {
  it('free user under quota can create more', () => {
    expect(canCreateMore(2, TIER_LIMITS.free.maxForms)).toBe(true);
    expect(canCreateMore(0, TIER_LIMITS.free.maxShortLinks)).toBe(true);
  });

  it('free user exactly at quota is blocked', () => {
    expect(canCreateMore(5, TIER_LIMITS.free.maxForms)).toBe(false);
    expect(canCreateMore(2, TIER_LIMITS.free.maxCertificates)).toBe(false);
  });

  it('free user above quota stays blocked (defensive)', () => {
    // Should never happen but server-side enforcement must hold.
    expect(canCreateMore(99, TIER_LIMITS.free.maxForms)).toBe(false);
  });

  it('pro user is never blocked, even with extreme counts', () => {
    expect(canCreateMore(0, TIER_LIMITS.pro.maxForms)).toBe(true);
    expect(canCreateMore(1_000_000, TIER_LIMITS.pro.maxCertificates)).toBe(true);
  });
});
