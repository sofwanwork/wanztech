/**
 * Subscription and pricing type definitions
 */

/**
 * Available subscription tiers
 */
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

/**
 * Subscription status
 */
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

/**
 * User subscription details
 */
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  promoEndsAt?: string;
}

/**
 * Monthly usage tracking
 */
export interface Usage {
  formsCreated: number;
  totalSubmissions: number;
  month: string;
}

/**
 * Limits for each subscription tier
 * -1 means unlimited
 */
export interface TierLimits {
  maxForms: number;
  maxSubmissionsPerForm: number;
  maxCertificates: number;
  maxQRCodes: number;
}
