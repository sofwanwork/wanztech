import { describe, it, expect } from 'vitest';
import { aggregateFormEvents } from '@/lib/analytics/aggregate';

type Row = Parameters<typeof aggregateFormEvents>[0][number];

function event(partial: Partial<Row>): Row {
  return {
    event_type: 'view',
    field_id: null,
    visitor_hash: null,
    device: 'desktop',
    duration_ms: null,
    created_at: new Date().toISOString(),
    ...partial,
  };
}

describe('aggregateFormEvents', () => {
  it('returns zeros for empty input', () => {
    const r = aggregateFormEvents([]);
    expect(r.totalViews).toBe(0);
    expect(r.totalSubmits).toBe(0);
    expect(r.uniqueVisitors).toBe(0);
    expect(r.conversionRate).toBe(0);
    expect(r.completionRate).toBe(0);
    expect(r.avgSubmitSeconds).toBeNull();
    expect(r.daily).toHaveLength(30);
    expect(r.fieldEngagement).toEqual([]);
  });

  it('counts views, starts, submits, abandons separately', () => {
    const r = aggregateFormEvents([
      event({ event_type: 'view', visitor_hash: 'a' }),
      event({ event_type: 'view', visitor_hash: 'a' }),
      event({ event_type: 'view', visitor_hash: 'b' }),
      event({ event_type: 'start' }),
      event({ event_type: 'submit', duration_ms: 30_000 }),
      event({ event_type: 'abandon', duration_ms: 5_000 }),
    ]);
    expect(r.totalViews).toBe(3);
    expect(r.totalStarts).toBe(1);
    expect(r.totalSubmits).toBe(1);
    expect(r.totalAbandons).toBe(1);
  });

  it('deduplicates unique visitors by hash (only counts views)', () => {
    const r = aggregateFormEvents([
      event({ event_type: 'view', visitor_hash: 'a' }),
      event({ event_type: 'view', visitor_hash: 'a' }),
      event({ event_type: 'view', visitor_hash: 'b' }),
      event({ event_type: 'view', visitor_hash: null }), // anonymous, ignored
      event({ event_type: 'submit', visitor_hash: 'c' }), // submits don't count toward unique-visitor metric
    ]);
    expect(r.uniqueVisitors).toBe(2);
  });

  it('computes conversion rate as submits / views (1 decimal place)', () => {
    const r = aggregateFormEvents([
      ...Array.from({ length: 100 }, () => event({ event_type: 'view' })),
      ...Array.from({ length: 7 }, () => event({ event_type: 'submit', duration_ms: 1000 })),
    ]);
    expect(r.conversionRate).toBe(7);
  });

  it('computes completion rate as submits / starts', () => {
    const r = aggregateFormEvents([
      ...Array.from({ length: 10 }, () => event({ event_type: 'start' })),
      ...Array.from({ length: 6 }, () => event({ event_type: 'submit', duration_ms: 1000 })),
    ]);
    expect(r.completionRate).toBe(60);
  });

  it('averages submit duration in seconds (rounded)', () => {
    const r = aggregateFormEvents([
      event({ event_type: 'submit', duration_ms: 30_000 }),
      event({ event_type: 'submit', duration_ms: 60_000 }),
      event({ event_type: 'submit', duration_ms: 90_000 }),
    ]);
    expect(r.avgSubmitSeconds).toBe(60);
  });

  it('aggregates field-engagement and sorts by descending count', () => {
    const r = aggregateFormEvents([
      event({ event_type: 'field_focus', field_id: 'f1' }),
      event({ event_type: 'field_focus', field_id: 'f2' }),
      event({ event_type: 'field_focus', field_id: 'f1' }),
      event({ event_type: 'field_focus', field_id: 'f1' }),
      event({ event_type: 'field_focus', field_id: 'f2' }),
    ]);
    expect(r.fieldEngagement).toEqual([
      { fieldId: 'f1', focuses: 3 },
      { fieldId: 'f2', focuses: 2 },
    ]);
  });

  it('counts device split only for views', () => {
    const r = aggregateFormEvents([
      event({ event_type: 'view', device: 'mobile' }),
      event({ event_type: 'view', device: 'mobile' }),
      event({ event_type: 'view', device: 'desktop' }),
      event({ event_type: 'view', device: 'bot' }),
      event({ event_type: 'submit', device: 'mobile' }), // not counted toward devices
    ]);
    expect(r.devices.mobile).toBe(2);
    expect(r.devices.desktop).toBe(1);
    expect(r.devices.bot).toBe(1);
    expect(r.devices.tablet).toBe(0);
  });

  it('returns last N daily buckets including zero days', () => {
    const r = aggregateFormEvents([], 7);
    expect(r.daily).toHaveLength(7);
    // Last bucket should be today (UTC)
    const today = new Date().toISOString().slice(0, 10);
    expect(r.daily[r.daily.length - 1].date).toBe(today);
    expect(r.daily.every((d) => d.views === 0 && d.submits === 0)).toBe(true);
  });

  it('places events into the correct daily bucket', () => {
    const today = new Date().toISOString().slice(0, 10);
    const r = aggregateFormEvents(
      [
        event({ event_type: 'view', created_at: `${today}T08:00:00.000Z` }),
        event({ event_type: 'view', created_at: `${today}T12:00:00.000Z` }),
        event({ event_type: 'submit', created_at: `${today}T13:00:00.000Z`, duration_ms: 1000 }),
      ],
      30
    );
    const todayBucket = r.daily.find((d) => d.date === today);
    expect(todayBucket).toBeDefined();
    expect(todayBucket!.views).toBe(2);
    expect(todayBucket!.submits).toBe(1);
  });
});
