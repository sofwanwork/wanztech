import { describe, it, expect } from 'vitest';
import { PRO_PRICE, PURCHASABLE_PLANS } from '@/lib/constants/pricing';

describe('PRO_PRICE (single source of truth)', () => {
  it('exposes the charged amount as a number for BCL', () => {
    expect(typeof PRO_PRICE.amount).toBe('number');
    expect(PRO_PRICE.amount).toBeGreaterThan(0);
  });

  it('display strings match the numeric amount', () => {
    expect(PRO_PRICE.display).toBe(`RM ${PRO_PRICE.amount}`);
    expect(PRO_PRICE.regularDisplay).toBe(`RM ${PRO_PRICE.regularAmount}`);
  });

  it('promo price is lower than the regular price', () => {
    expect(PRO_PRICE.amount).toBeLessThan(PRO_PRICE.regularAmount);
  });

  it('has a description used by the payment gateway', () => {
    expect(PRO_PRICE.description).toContain('KlikForm Pro');
  });

  it('only pro is purchasable via checkout', () => {
    expect(PURCHASABLE_PLANS).toEqual(['pro']);
  });
});
