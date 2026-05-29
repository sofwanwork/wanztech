/**
 * Pure aggregation utilities for form analytics.
 * Kept separate from `actions/analytics.ts` because that file is a Server
 * Action module — every export there must be async.
 */

export type AnalyticsEventType = 'view' | 'start' | 'field_focus' | 'submit' | 'abandon';

export interface FormEventRow {
  event_type: AnalyticsEventType;
  field_id: string | null;
  visitor_hash: string | null;
  device: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown' | null;
  duration_ms: number | null;
  created_at: string;
}

export interface FormAnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  totalStarts: number;
  totalSubmits: number;
  totalAbandons: number;
  /** % of views that became submits */
  conversionRate: number;
  /** % of starts that became submits */
  completionRate: number;
  /** Average submit duration in seconds */
  avgSubmitSeconds: number | null;
  /** Daily counts for the last `days` window */
  daily: Array<{ date: string; views: number; submits: number }>;
  /** Field-level engagement: how often each field was focused */
  fieldEngagement: Array<{ fieldId: string; focuses: number }>;
  /** Device split (only views are counted) */
  devices: Record<'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown', number>;
}

/**
 * Pure aggregation function — exported for unit testing AND for the server
 * action wrapper in `actions/analytics.ts`. No I/O, no async, deterministic.
 */
export function aggregateFormEvents(
  events: FormEventRow[],
  days = 30
): FormAnalyticsSummary {
  const totalViews = events.filter((e) => e.event_type === 'view').length;
  const totalStarts = events.filter((e) => e.event_type === 'start').length;
  const submits = events.filter((e) => e.event_type === 'submit');
  const totalSubmits = submits.length;
  const totalAbandons = events.filter((e) => e.event_type === 'abandon').length;

  const uniqueVisitorsSet = new Set<string>();
  for (const e of events) {
    if (e.event_type === 'view' && e.visitor_hash) uniqueVisitorsSet.add(e.visitor_hash);
  }

  const avgSubmitSeconds =
    submits.length > 0
      ? Math.round(
          submits.reduce((sum, e) => sum + (e.duration_ms ?? 0), 0) / submits.length / 1000
        )
      : null;

  // Daily series (last `days` days)
  const dailyMap = new Map<string, { views: number; submits: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { views: 0, submits: 0 });
  }
  for (const e of events) {
    const key = e.created_at.slice(0, 10);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    if (e.event_type === 'view') bucket.views++;
    else if (e.event_type === 'submit') bucket.submits++;
  }

  // Field engagement
  const fieldMap = new Map<string, number>();
  for (const e of events) {
    if (e.event_type === 'field_focus' && e.field_id) {
      fieldMap.set(e.field_id, (fieldMap.get(e.field_id) ?? 0) + 1);
    }
  }

  // Device split (views only)
  const devices = { mobile: 0, tablet: 0, desktop: 0, bot: 0, unknown: 0 };
  for (const e of events) {
    if (e.event_type === 'view') {
      const d = e.device ?? 'unknown';
      devices[d]++;
    }
  }

  return {
    totalViews,
    uniqueVisitors: uniqueVisitorsSet.size,
    totalStarts,
    totalSubmits,
    totalAbandons,
    conversionRate: totalViews > 0 ? Math.round((totalSubmits / totalViews) * 1000) / 10 : 0,
    completionRate: totalStarts > 0 ? Math.round((totalSubmits / totalStarts) * 1000) / 10 : 0,
    avgSubmitSeconds,
    daily: Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })),
    fieldEngagement: Array.from(fieldMap.entries())
      .map(([fieldId, focuses]) => ({ fieldId, focuses }))
      .sort((a, b) => b.focuses - a.focuses),
    devices,
  };
}
