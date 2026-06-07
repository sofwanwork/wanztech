import type { FormField, FormFieldType } from '@/lib/types';

/** One option's tally within a field. */
export interface OptionCount {
  value: string;
  count: number;
  /** Percentage of respondents (who answered this field) that picked it. */
  pct: number;
}

/** Aggregated distribution for a single chartable field. */
export interface ResponseFieldSummary {
  fieldId: string;
  label: string;
  type: FormFieldType;
  /** Number of submissions that provided a (non-empty) answer for this field. */
  totalAnswered: number;
  options: OptionCount[];
  /** Average value for rating fields (undefined for others). */
  average?: number;
}

/** Field types we can render as a distribution chart. */
const CHARTABLE: ReadonlySet<FormFieldType> = new Set<FormFieldType>([
  'select',
  'radio',
  'checkbox',
  'rating',
]);

export function isChartable(type: FormFieldType): boolean {
  return CHARTABLE.has(type);
}

/**
 * Turn raw Google Sheet rows into per-field distributions for the chartable
 * field types. Rows are keyed by the column header (which equals the field
 * LABEL, since that's how submissions are written to the sheet).
 *
 * Pure & deterministic — no Google/network — so it can be unit-tested.
 */
export function aggregateResponses(
  rows: Record<string, string>[],
  fields: FormField[]
): ResponseFieldSummary[] {
  const summaries: ResponseFieldSummary[] = [];

  for (const field of fields) {
    if (!isChartable(field.type)) continue;

    const counts = new Map<string, number>();
    // Seed with the field's declared options so zero-count options still show.
    for (const opt of field.options ?? []) counts.set(opt, 0);

    let totalAnswered = 0;
    let ratingSum = 0;
    let ratingN = 0;

    for (const row of rows) {
      const raw = (row[field.label] ?? '').toString().trim();
      if (!raw) continue;

      if (field.type === 'checkbox') {
        // Checkbox answers are stored joined, e.g. "A, B, C".
        const parts = raw
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length === 0) continue;
        totalAnswered++;
        for (const p of parts) counts.set(p, (counts.get(p) ?? 0) + 1);
      } else if (field.type === 'rating') {
        totalAnswered++;
        counts.set(raw, (counts.get(raw) ?? 0) + 1);
        const num = Number(raw);
        if (!Number.isNaN(num)) {
          ratingSum += num;
          ratingN++;
        }
      } else {
        // select / radio — single value
        totalAnswered++;
        counts.set(raw, (counts.get(raw) ?? 0) + 1);
      }
    }

    const options: OptionCount[] = Array.from(counts.entries())
      .map(([value, count]) => ({
        value,
        count,
        pct: totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0,
      }))
      // Highest first; keep declared (zero) options after non-zero by count.
      .sort((a, b) => b.count - a.count);

    summaries.push({
      fieldId: field.id,
      label: field.label,
      type: field.type,
      totalAnswered,
      options,
      average:
        field.type === 'rating' && ratingN > 0
          ? Math.round((ratingSum / ratingN) * 100) / 100
          : undefined,
    });
  }

  return summaries;
}
