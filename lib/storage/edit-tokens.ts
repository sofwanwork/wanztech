import 'server-only';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';

export interface EditTokenRow {
  id: string;
  token: string;
  formId: string;
  userId: string;
  submissionId: string;
  email: string | null;
  snapshot: Record<string, string>;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

interface DbRow {
  id: string;
  token: string;
  form_id: string;
  user_id: string;
  submission_id: string;
  email: string | null;
  snapshot: unknown;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

function rowToToken(row: DbRow): EditTokenRow {
  return {
    id: row.id,
    token: row.token,
    formId: row.form_id,
    userId: row.user_id,
    submissionId: row.submission_id,
    email: row.email,
    snapshot: (row.snapshot as Record<string, string>) ?? {},
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
}

/**
 * Cryptographically-strong URL-safe token. 32 bytes → 64 hex chars.
 */
export function generateEditToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a token row. Called from the public submission pipeline via the
 * admin client (no auth context).
 */
export async function createEditToken(input: {
  formId: string;
  userId: string;
  submissionId: string;
  email: string | null;
  snapshot: Record<string, string>;
  expiryDays: number;
}): Promise<string> {
  const admin = createAdminClient();
  const token = generateEditToken();
  const expiresAt = new Date(
    Date.now() + Math.max(1, input.expiryDays) * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await admin.from('response_edit_tokens').insert({
    token,
    form_id: input.formId,
    user_id: input.userId,
    submission_id: input.submissionId,
    email: input.email,
    snapshot: input.snapshot,
    expires_at: expiresAt,
  });
  if (error) {
    console.error('[edit-token] create error:', error);
    throw new Error('Failed to create edit token');
  }
  return token;
}

/**
 * Look up a token. Public path — uses admin client because the visitor is
 * not authenticated. Verifies expiry/usage in code.
 */
export async function getEditToken(token: string): Promise<
  | { valid: true; row: EditTokenRow }
  | { valid: false; reason: 'not_found' | 'used' | 'expired' }
> {
  if (!token || token.length < 16) return { valid: false, reason: 'not_found' };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('response_edit_tokens')
    .select('*')
    .eq('token', token)
    .single();
  if (error || !data) return { valid: false, reason: 'not_found' };
  const row = rowToToken(data as DbRow);
  if (row.usedAt) return { valid: false, reason: 'used' };
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    return { valid: false, reason: 'expired' };
  }
  return { valid: true, row };
}

/**
 * Mark a token as consumed. Single-use semantics so a leaked link can only
 * cause one unauthorized edit at most.
 */
export async function markEditTokenUsed(id: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('response_edit_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.warn('[edit-token] markUsed error:', error);
  }
}
