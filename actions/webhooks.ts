'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  listWebhooksForForm,
  createWebhook,
  updateWebhook,
  deleteWebhook,
} from '@/lib/storage/webhooks';
import type { FormWebhook, WebhookEvent } from '@/lib/types/webhooks';
import { dispatchWebhook } from '@/lib/webhooks/dispatch';

const urlSchema = z
  .string()
  .url('URL tidak sah')
  .refine((u) => u.startsWith('https://') || u.startsWith('http://'), {
    message: 'URL mesti bermula dengan http:// atau https://',
  });

const createSchema = z.object({
  formId: z.string().uuid(),
  url: urlSchema,
  secret: z.string().min(8, 'Secret mesti sekurang-kurangnya 8 aksara'),
  events: z.array(z.enum(['submission'])).min(1),
  enabled: z.boolean().default(true),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  url: urlSchema.optional(),
  secret: z.string().min(8).optional(),
  events: z.array(z.enum(['submission'])).optional(),
  enabled: z.boolean().optional(),
});

export async function listWebhooksAction(formId: string): Promise<FormWebhook[]> {
  return listWebhooksForForm(formId);
}

export async function createWebhookAction(input: {
  formId: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  enabled: boolean;
}): Promise<{ success: true; webhook: FormWebhook } | { success: false; error: string }> {
  try {
    const parsed = createSchema.parse(input);
    const webhook = await createWebhook(parsed);
    revalidatePath(`/builder/${parsed.formId}`);
    return { success: true, webhook };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0]?.message ?? 'Input tidak sah' };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal mencipta webhook',
    };
  }
}

export async function updateWebhookAction(input: {
  id: string;
  url?: string;
  secret?: string;
  events?: WebhookEvent[];
  enabled?: boolean;
}): Promise<{ success: true; webhook: FormWebhook } | { success: false; error: string }> {
  try {
    const parsed = updateSchema.parse(input);
    const { id, ...patch } = parsed;
    const webhook = await updateWebhook(id, patch);
    return { success: true, webhook };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0]?.message ?? 'Input tidak sah' };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal mengemas kini webhook',
    };
  }
}

export async function deleteWebhookAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteWebhook(id);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal memadam webhook',
    };
  }
}

/**
 * Send a synthetic test event to the webhook URL using the current secret.
 * Owner-only — uses the auth-aware client to read the row, then dispatches.
 */
export async function testWebhookAction(input: {
  formId: string;
  webhookId: string;
}): Promise<{ ok: boolean; status: number | null; error?: string }> {
  try {
    const { listWebhooksForDispatch } = await import('@/lib/storage/webhooks');
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, status: null, error: 'Unauthorized' };

    const all = await listWebhooksForDispatch(input.formId, user.id, 'submission');
    const target = all.find((w) => w.id === input.webhookId);
    if (!target) {
      return { ok: false, status: null, error: 'Webhook tidak dijumpai' };
    }

    const result = await dispatchWebhook({
      url: target.url,
      secret: target.secret,
      payload: {
        event: 'submission',
        formId: target.formId,
        formTitle: '[Test event]',
        submittedAt: new Date().toISOString(),
        data: { test: 'true', source: 'klikform-test' },
      },
      // Single attempt for tests so the user gets feedback fast.
      maxAttempts: 1,
      timeoutMs: 5_000,
    });

    return { ok: result.ok, status: result.status, error: result.error };
  } catch (err) {
    return {
      ok: false,
      status: null,
      error: err instanceof Error ? err.message : 'Test gagal',
    };
  }
}
