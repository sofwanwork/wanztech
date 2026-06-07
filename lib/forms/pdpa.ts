import type { PdpaSettings } from '@/lib/types';

/** Whether this form requires an explicit PDPA consent before submission. */
export function requiresPdpaConsent(pdpa?: PdpaSettings): boolean {
  return !!pdpa?.enabled;
}

/**
 * Normalizes the consent flag coming from a FormData/object payload. The
 * client appends the string `'true'` when the box is ticked; anything else
 * (missing, `'false'`, empty) counts as not consented.
 */
export function isConsentGiven(rawValue: unknown): boolean {
  return String(rawValue ?? '') === 'true';
}

/**
 * Server-side gate: returns true when the submission is allowed to proceed
 * with respect to PDPA. Forms without PDPA always pass.
 */
export function isPdpaSubmissionAllowed(
  pdpa: PdpaSettings | undefined,
  rawConsentValue: unknown
): boolean {
  if (!requiresPdpaConsent(pdpa)) return true;
  return isConsentGiven(rawConsentValue);
}
