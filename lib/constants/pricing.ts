/**
 * Pricing — single source of truth.
 *
 * Previously the Pro price was hardcoded in THREE places (payment initiate
 * route, pricing page, pricing modal) plus a dead TIER_PRICING block. When
 * the promo ends, only this file needs to change.
 */

export interface PricingConfig {
  amount: number;
  regularAmount: number;
  display: string;
  regularDisplay: string;
  period: string;
  periodDetail: string;
  priceDetail: string;
  description: string;
}

export const PRO_PRICE: PricingConfig = {
  /** Amount charged to BCL (MYR). RM 15 monthly subscription. */
  amount: 15.0,
  /** Regular price. Display-only. */
  regularAmount: 15,
  /** Human-readable strings for UI. */
  display: 'RM 15',
  regularDisplay: 'RM 15',
  period: '/ month',
  periodDetail: '',
  priceDetail: 'Cancel anytime',
  description: 'KlikForm Pro Plan - Monthly Subscription (RM 15/month)',
};

export type PlanId = 'free' | 'pro' | 'enterprise';

/** Plans that can be purchased via BCL checkout (enterprise = contact us). */
export const PURCHASABLE_PLANS: PlanId[] = ['pro'];
