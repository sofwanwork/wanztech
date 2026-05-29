'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { headers as getNextHeaders } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  aggregateFormEvents,
  aggregateUserAnalytics,
  type FormEventRow,
  type FormAnalyticsSummary,
  type UserAnalyticsRow,
  type UserAnalyticsSummary,
  type AnalyticsEventType,
} from '@/lib/analytics/aggregate';
import crypto from 'crypto';

interface TrackEventInput {
  formId: string;
  eventType: AnalyticsEventType;
  fieldId?: string;
  sessionId: string;
  durationMs?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Daily-rotating IP hash: SHA-256(ip + YYYY-MM-DD + secret).
 * Day-rotation gives accurate daily unique counts but no long-term tracking.
 */
function hashVisitor(ip: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const secret =
    process.env.ANALYTICS_HASH_SECRET || process.env.ENCRYPTION_KEY || 'klikform-default';
  return crypto.createHash('sha256').update(`${ip}|${day}|${secret}`).digest('hex').slice(0, 32);
}

/** Coarse device family from User-Agent. No fingerprinting. */
function detectDevice(ua: string | null): 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown' {
  if (!ua) return 'unknown';
  const s = ua.toLowerCase();
  if (/bot|crawl|spider|slurp|wget|curl|postman/.test(s)) return 'bot';
  if (/ipad|tablet/.test(s)) return 'tablet';
  if (/mobi|iphone|android.*mobile|phone/.test(s)) return 'mobile';
  return 'desktop';
}

// ─── Tracking ────────────────────────────────────────────────────────────────

/**
 * Records a single analytics event from the public form client.
 * Uses the admin client so anonymous visitors can write WITHOUT broadening RLS.
 * Rate-limited per IP.
 */
export async function trackFormEvent(input: TrackEventInput): Promise<{ ok: boolean }> {
  try {
    const headersList = await getNextHeaders();
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown';
    const ua = headersList.get('user-agent');

    // 100 events / minute / IP. Generous since field_focus fires often.
    const rl = await checkRateLimit(ip, { limit: 100, windowMs: 60_000 }, 'analytics');
    if (!rl.success) return { ok: false };

    const admin = createAdminClient();

    const { data: form } = await admin
      .from('forms')
      .select('user_id')
      .eq('id', input.formId)
      .single();
    if (!form) return { ok: false };

    const { error } = await admin.from('form_events').insert({
      form_id: input.formId,
      user_id: form.user_id,
      event_type: input.eventType,
      field_id: input.fieldId ?? null,
      visitor_hash: hashVisitor(ip),
      device: detectDevice(ua),
      session_id: input.sessionId,
      duration_ms: input.durationMs ?? null,
    });

    if (error) {
      console.error('[analytics] insert error:', error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('[analytics] trackFormEvent failed:', err);
    return { ok: false };
  }
}

/**
 * Owner-only fetch + aggregate. Enforces RLS on user_id.
 */
export async function getFormAnalytics(
  formId: string,
  days = 30
): Promise<FormAnalyticsSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const { data, error } = await supabase
    .from('form_events')
    .select('event_type, field_id, visitor_hash, device, duration_ms, created_at')
    .eq('form_id', formId)
    .eq('user_id', user.id)
    .gte('created_at', since.toISOString());

  if (error) {
    console.error('[analytics] fetch error:', error);
    return null;
  }
  return aggregateFormEvents((data ?? []) as FormEventRow[], days);
}

/**
 * Cross-form summary for the current user. RLS auto-restricts to the
 * caller's own forms, so we don't need a manual user_id filter (kept
 * defensively though, mirroring `getFormAnalytics`).
 */
export async function getUserAnalyticsSummary(
  days = 30
): Promise<UserAnalyticsSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const { data, error } = await supabase
    .from('form_events')
    .select('event_type, field_id, visitor_hash, device, duration_ms, created_at, form_id')
    .eq('user_id', user.id)
    .gte('created_at', since.toISOString());

  if (error) {
    console.error('[analytics] user-summary fetch error:', error);
    return null;
  }
  return aggregateUserAnalytics((data ?? []) as UserAnalyticsRow[], days);
}
