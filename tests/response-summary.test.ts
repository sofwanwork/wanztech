import { describe, it, expect } from 'vitest';
import { aggregateResponses, isChartable } from '@/lib/analytics/responses';
import type { FormField } from '@/lib/types';

function field(id: string, type: FormField['type'], options?: string[]): FormField {
  return { id, type, label: id, required: false, options };
}

describe('isChartable', () => {
  it('charts only choice + rating types', () => {
    expect(isChartable('select')).toBe(true);
    expect(isChartable('radio')).toBe(true);
    expect(isChartable('checkbox')).toBe(true);
    expect(isChartable('rating')).toBe(true);
    expect(isChartable('text')).toBe(false);
    expect(isChartable('email')).toBe(false);
  });
});

describe('aggregateResponses', () => {
  it('skips non-chartable fields', () => {
    const summaries = aggregateResponses([{ Nama: 'Ali' }], [field('Nama', 'text')]);
    expect(summaries).toEqual([]);
  });

  it('counts select/radio answers and computes percentages', () => {
    const f = field('Bahagian', 'select', ['IT', 'HR', 'Finance']);
    const rows = [
      { Bahagian: 'IT' },
      { Bahagian: 'IT' },
      { Bahagian: 'HR' },
      { Bahagian: '' }, // unanswered — ignored
    ];
    const [s] = aggregateResponses(rows, [f]);
    expect(s.totalAnswered).toBe(3);
    const it = s.options.find((o) => o.value === 'IT')!;
    expect(it.count).toBe(2);
    expect(it.pct).toBe(67); // 2/3
    const finance = s.options.find((o) => o.value === 'Finance')!;
    expect(finance.count).toBe(0); // declared option with no answers still shown
    // sorted highest first
    expect(s.options[0].value).toBe('IT');
  });

  it('splits checkbox multi-answers and counts each option', () => {
    const f = field('Hari', 'checkbox', ['Isnin', 'Selasa', 'Rabu']);
    const rows = [
      { Hari: 'Isnin, Selasa' },
      { Hari: 'Isnin' },
      { Hari: 'Rabu, Selasa, Isnin' },
    ];
    const [s] = aggregateResponses(rows, [f]);
    expect(s.totalAnswered).toBe(3);
    expect(s.options.find((o) => o.value === 'Isnin')!.count).toBe(3);
    expect(s.options.find((o) => o.value === 'Selasa')!.count).toBe(2);
    expect(s.options.find((o) => o.value === 'Rabu')!.count).toBe(1);
  });

  it('computes the average for rating fields', () => {
    const f = field('Rating', 'rating');
    const rows = [{ Rating: '5' }, { Rating: '4' }, { Rating: '3' }];
    const [s] = aggregateResponses(rows, [f]);
    expect(s.totalAnswered).toBe(3);
    expect(s.average).toBe(4); // (5+4+3)/3
    expect(s.options.find((o) => o.value === '5')!.count).toBe(1);
  });

  it('handles a field with no matching column gracefully', () => {
    const f = field('Ghost', 'select', ['A', 'B']);
    const [s] = aggregateResponses([{ Other: 'x' }], [f]);
    expect(s.totalAnswered).toBe(0);
    expect(s.options.every((o) => o.count === 0)).toBe(true);
  });
});
