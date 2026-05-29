/**
 * Outgoing webhook configuration.
 *
 * Each form may have any number of webhooks. The `secret` is stored
 * encrypted at rest via `lib/encryption.ts` — only the plaintext form is
 * ever used in memory at dispatch time.
 *
 * The HMAC signature mirrors the inbound BCL webhook verifier so we can
 * unit-test both sides against the same canonical implementation in
 * `tests/webhook-signature.test.ts`.
 */

export type WebhookEvent = 'submission';

export interface FormWebhook {
  id: string;
  formId: string;
  userId: string;
  url: string;
  /** Plaintext at the application layer; encrypted in the DB. */
  secret: string;
  events: WebhookEvent[];
  enabled: boolean;
  lastStatus?: number | null;
  lastError?: string | null;
  lastFiredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookSubmissionPayload {
  event: 'submission';
  formId: string;
  formTitle: string;
  /** ISO timestamp from the server. */
  submittedAt: string;
  /** Field label → string-coerced value map. Mirrors what hits Google Sheets. */
  data: Record<string, string>;
}
