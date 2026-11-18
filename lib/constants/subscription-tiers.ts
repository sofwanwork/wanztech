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
    maxShortLinks: 5,
    maxBioPages: 1,
    maxPamphlets: 2,
  },
  pro: {
    maxForms: -1,
    maxSubmissionsPerForm: -1,
    maxCertificates: -1,
    maxQRCodes: -1,
    maxShortLinks: -1,
    maxBioPages: -1,
    maxPamphlets: -1,
  },
  enterprise: {
    maxForms: -1,
    maxSubmissionsPerForm: -1,
    maxCertificates: -1,
    maxQRCodes: -1,
    maxShortLinks: -1,
    maxBioPages: -1,
    maxPamphlets: -1,
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

/**
 * Resolve the effective subscription tier from a database subscription row.
 * Inactive statuses (expired, cancelled, grace_period) or past period ends
 * fall back to 'free' so public/paid privileges stay enforced.
 */
export function resolveEffectiveTierFromRow(
  sub?: {
    tier?: string | null;
    status?: string | null;
    current_period_end?: string | null;
  } | null,
  nowMs = Date.now()
): SubscriptionTier {
  if (!sub?.tier || sub.tier === 'free') return 'free';
  if (sub.status && sub.status !== 'active') return 'free';
  if (sub.current_period_end) {
    const periodEnd = new Date(sub.current_period_end);
    if (!Number.isNaN(periodEnd.getTime()) && periodEnd.getTime() < nowMs) {
      return 'free';
    }
  }
  if (sub.tier === 'pro' || sub.tier === 'enterprise') {
    return sub.tier;
  }
  return 'free';
}
