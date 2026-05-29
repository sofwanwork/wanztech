import { describe, it, expect } from 'vitest';
import {
  aggregateUserAnalytics,
  type UserAnalyticsRow,
} from '@/lib/analytics/aggregate';

const today = new Date();
const isoToday = today.toISOString();
const isoYesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString();

const row = (overrides: Partial<UserAnalyticsRow>): UserAnalyticsRow => ({
  event_type: 'view',
  field_id: null,
  visitor_hash: null,
  device: null,
  duration_ms: null,
  created_at: isoToday,
  form_id: 'form-A',
  ...overrides,
});

describe('aggregateUserAnalytics — empty', () => {
  it('returns zero state for empty input', () => {
    const out = aggregateUserAnalytics([], 30);
    expect(out.totalViews).toBe(0);
    expect(out.totalSubmits).toBe(0);
    expect(out.uniqueVisitors).toBe(0);
    expect(out.conversionRate).toBe(0);
    expect(out.topForms).toEqual([]);
    expect(out.daily.length).toBe(30);
    expect(out.daily.every((d) => d.views === 0 && d.submits === 0)).toBe(true);
  });
});

describe('aggregateUserAnalytics — counting', () => {
  it('counts views and submits across forms', () => {
    const events: UserAnalyticsRow[] = [
      row({ form_id: 'A', event_type: 'view', visitor_hash: 'v1' }),
      row({ form_id: 'A', event_type: 'view', visitor_hash: 'v1' }),
      row({ form_id: 'A', event_type: 'submit' }),
      row({ form_id: 'B', event_type: 'view', visitor_hash: 'v2' }),
      row({ form_id: 'B', event_type: 'submit' }),
      row({ form_id: 'B', event_type: 'submit' }),
      row({ form_id: 'C', event_type: 'view', visitor_hash: 'v3' }),
    ];
    const out = aggregateUserAnalytics(events, 30);
    expect(out.totalViews).toBe(4);
    expect(out.totalSubmits).toBe(3);
    expect(out.uniqueVisitors).toBe(3);
    // 3 / 4 = 75%
    expect(out.conversionRate).toBe(75);
  });
});

describe('aggregateUserAnalytics — top forms ranking', () => {
  it('orders by submit count, then by views as tiebreaker', () => {
    const events: UserAnalyticsRow[] = [
      // A: 1 submit, 5 views
      row({ form_id: 'A', event_type: 'view' }),
      row({ form_id: 'A', event_type: 'view' }),
      row({ form_id: 'A', event_type: 'view' }),
      row({ form_id: 'A', event_type: 'view' }),
      row({ form_id: 'A', event_type: 'view' }),
      row({ form_id: 'A', event_type: 'submit' }),
      // B: 3 submits, 3 views
      row({ form_id: 'B', event_type: 'view' }),
      row({ form_id: 'B', event_type: 'view' }),
      row({ form_id: 'B', event_type: 'view' }),
      row({ form_id: 'B', event_type: 'submit' }),
      row({ form_id: 'B', event_type: 'submit' }),
      row({ form_id: 'B', event_type: 'submit' }),
      // C: 1 submit, 1 view
      row({ form_id: 'C', event_type: 'view' }),
      row({ form_id: 'C', event_type: 'submit' }),
    ];
    const out = aggregateUserAnalytics(events, 30);
    expect(out.topForms[0]).toEqual({ formId: 'B', submits: 3, views: 3 });
    // A has more views than C → A comes first when submits are tied (1 == 1)
    expect(out.topForms[1]).toEqual({ formId: 'A', submits: 1, views: 5 });
    expect(out.topForms[2]).toEqual({ formId: 'C', submits: 1, views: 1 });
  });

  it('caps top forms at 5', () => {
    const events: UserAnalyticsRow[] = [];
    for (let i = 0; i < 8; i++) {
      events.push(
        row({ form_id: `F${i}`, event_type: 'submit' }),
        row({ form_id: `F${i}`, event_type: 'view' })
      );
    }
    const out = aggregateUserAnalytics(events, 30);
    expect(out.topForms.length).toBe(5);
  });
});

describe('aggregateUserAnalytics — daily series', () => {
  it('places events in the correct daily bucket', () => {
    const events: UserAnalyticsRow[] = [
      row({ event_type: 'view', created_at: isoYesterday }),
      row({ event_type: 'submit', created_at: isoYesterday }),
      row({ event_type: 'view', created_at: isoToday }),
    ];
    const out = aggregateUserAnalytics(events, 30);
    const todayKey = isoToday.slice(0, 10);
    const yKey = isoYesterday.slice(0, 10);
    const todayBucket = out.daily.find((d) => d.date === todayKey);
    const yBucket = out.daily.find((d) => d.date === yKey);
    expect(todayBucket).toEqual({ date: todayKey, views: 1, submits: 0 });
    expect(yBucket).toEqual({ date: yKey, views: 1, submits: 1 });
  });

  it('drops events outside the window silently', () => {
    const oldDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const events: UserAnalyticsRow[] = [row({ event_type: 'view', created_at: oldDate })];
    const out = aggregateUserAnalytics(events, 30);
    // Aggregate counters still see the event:
    expect(out.totalViews).toBe(1);
    // …but no daily bucket exists for it.
    expect(out.daily.find((d) => d.date === oldDate.slice(0, 10))).toBeUndefined();
  });
});
