import { describe, it, expect } from 'vitest';
import { PRO_PRICE, PURCHASABLE_PLANS } from '@/lib/constants/pricing';

describe('PRO_PRICE (single source of truth)', () => {
  it('exposes the charged amount as a number for BCL', () => {
    expect(typeof PRO_PRICE.amount).toBe('number');
    expect(PRO_PRICE.amount).toBe(15);
  });

  it('display strings match the numeric amount', () => {
    expect(PRO_PRICE.display).toBe(`RM ${PRO_PRICE.amount}`);
  });

  it('has a description used by the payment gateway', () => {
    expect(PRO_PRICE.description).toContain('KlikForm Pro');
  });

  it('only pro is purchasable via checkout', () => {
    expect(PURCHASABLE_PLANS).toEqual(['pro']);
  });
});
