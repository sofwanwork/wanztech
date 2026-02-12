/**
 * Subscription tier configuration constants
 */

import { SubscriptionTier, TierLimits } from '../types/subscription';

/**
 * Limits for each subscription tier
 * -1 = unlimited
 */
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxForms: 5,
    maxSubmissionsPerForm: 3000,
    maxCertificates: 2,
    maxQRCodes: 5,
  },
  pro: {
    maxForms: -1,
    maxSubmissionsPerForm: -1,
    maxCertificates: -1,
    maxQRCodes: -1,
  },
  enterprise: {
    maxForms: -1,
    maxSubmissionsPerForm: -1,
    maxCertificates: -1,
    maxQRCodes: -1,
  },
};

/**
 * Pricing information for display
 */
export const TIER_PRICING = {
  free: {
    name: 'Free',
    price: 0,
    period: 'forever',
  },
  pro: {
    name: 'Pro',
    price: 29,
    period: 'month',
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    period: 'month',
  },
} as const;
