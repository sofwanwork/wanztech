/**
 * Pricing — single source of truth.
 *
 * Previously the Pro price was hardcoded in THREE places (payment initiate
 * route, pricing page, pricing modal) plus a dead TIER_PRICING block. When
 * the promo ends, only this file needs to change.
 */

export const PRO_PRICE = {
  /** Amount charged to BCL (MYR). 50% launch promo. */
  amount: 5.0,
  /** Regular price after the promo period. Display-only. */
  regularAmount: 10,
  /** Human-readable strings for UI. */
  display: 'RM 5',
  regularDisplay: 'RM 10',
  period: '/ month',
  periodDetail: 'for first 3 months (50% discount)',
  priceDetail: 'then RM 10 / month',
  description: 'KlikForm Pro Plan - Monthly Subscription (50% Promo)',
} as const;

export type PlanId = 'free' | 'pro' | 'enterprise';

/** Plans that can be purchased via BCL checkout (enterprise = contact us). */
export const PURCHASABLE_PLANS: PlanId[] = ['pro'];
