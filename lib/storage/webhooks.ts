import 'server-only';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { encrypt, decrypt } from '@/lib/encryption';
import type { FormWebhook, WebhookEvent } from '@/lib/types/webhooks';

interface DbRow {
  id: string;
  form_id: string;
  user_id: string;
  url: string;
  secret_encrypted: string;
  events: string[];
  enabled: boolean;
  last_status: number | null;
  last_error: string | null;
  last_fired_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToWebhook(row: DbRow, includeSecret = false): FormWebhook {
  return {
    id: row.id,
    formId: row.form_id,
    userId: row.user_id,
    url: row.url,
    // Decrypt only when caller explicitly asks (dispatch path).
    // The list-for-builder path returns a placeholder so the secret never
    // leaves the server in plaintext.
    secret: includeSecret ? decrypt(row.secret_encrypted) : '••••••••',
    events: (row.events ?? []) as WebhookEvent[],
    enabled: row.enabled,
    lastStatus: row.last_status,
    lastError: row.last_error,
    lastFiredAt: row.last_fired_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return { supabase, user };
}

/**
 * List webhooks for a form (owner-only via RLS). Secret is masked.
 */
export async function listWebhooksForForm(formId: string): Promise<FormWebhook[]> {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase
    .from('form_webhooks')
    .select('*')
    .eq('form_id', formId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[webhooks] list error:', error);
    return [];
  }
  return (data as DbRow[]).map((r) => rowToWebhook(r, false));
}

/**
 * Server-side fetch (admin client) for the dispatch path during a public
 * form submission. Decrypts secrets. Always scoped by `form_id` AND
 * `user_id` so a missing/forged form_id can never leak other tenants'
 * webhooks.
 */
export async function listWebhooksForDispatch(
  formId: string,
  userId: string,
  event: WebhookEvent
): Promise<FormWebhook[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('form_webhooks')
    .select('*')
    .eq('form_id', formId)
    .eq('user_id', userId)
    .eq('enabled', true)
    .contains('events', [event]);
  if (error) {
    console.error('[webhooks] dispatch list error:', error);
    return [];
  }
  return (data as DbRow[]).map((r) => rowToWebhook(r, true));
}

export async function createWebhook(input: {
  formId: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  enabled: boolean;
}): Promise<FormWebhook> {
  const { supabase, user } = await getUser();

  // Verify the form belongs to this user before letting them attach a webhook.
  const { data: form } = await supabase
    .from('forms')
    .select('user_id')
    .eq('id', input.formId)
    .single();
  if (!form || form.user_id !== user.id) {
    throw new Error('Form not found or unauthorized');
  }

  const { data, error } = await supabase
    .from('form_webhooks')
    .insert({
      form_id: input.formId,
      user_id: user.id,
      url: input.url,
      secret_encrypted: encrypt(input.secret),
      events: input.events,
      enabled: input.enabled,
    })
    .select('*')
    .single();
  if (error || !data) {
    console.error('[webhooks] create error:', error);
    throw new Error('Failed to create webhook');
  }
  return rowToWebhook(data as DbRow, false);
}

export async function updateWebhook(
  id: string,
  patch: Partial<{ url: string; secret: string; events: WebhookEvent[]; enabled: boolean }>
): Promise<FormWebhook> {
  const { supabase, user } = await getUser();
  const update: Record<string, unknown> = {};
  if (patch.url !== undefined) update.url = patch.url;
  if (patch.events !== undefined) update.events = patch.events;
  if (patch.enabled !== undefined) update.enabled = patch.enabled;
  if (patch.secret !== undefined && patch.secret) {
    update.secret_encrypted = encrypt(patch.secret);
  }

  const { data, error } = await supabase
    .from('form_webhooks')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();
  if (error || !data) {
    console.error('[webhooks] update error:', error);
    throw new Error('Failed to update webhook');
  }
  return rowToWebhook(data as DbRow, false);
}

export async function deleteWebhook(id: string): Promise<void> {
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from('form_webhooks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) {
    console.error('[webhooks] delete error:', error);
    throw new Error('Failed to delete webhook');
  }
}

/**
 * Update the dispatch result fields. Called from the public submission
 * pipeline via the admin client (no auth context).
 */
export async function recordWebhookResult(
  id: string,
  result: { status: number | null; error?: string | null }
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('form_webhooks')
    .update({
      last_status: result.status,
      last_error: result.error ?? null,
      last_fired_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) {
    console.warn('[webhooks] recordResult error:', error);
  }
}
