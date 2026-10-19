/**
 * Utilities for Multiple Choice Grid (Likert Scale / Matrix) form fields.
 */

import type { FormField, GridConfig } from '@/lib/types/forms';

/**
 * Default grid configuration for newly created grid fields.
 */
export function createDefaultGridConfig(): GridConfig {
  return {
    rows: ['Statement 1', 'Statement 2', 'Statement 3'],
    columns: ['1', '2', '3', '4', '5'],
    minLabel: 'Sangat Tidak Setuju',
    maxLabel: 'Sangat Setuju',
  };
}

/**
 * Popular presets for grid scales.
 */
export const GRID_PRESET_SCALES = [
  {
    id: 'scale_1_5',
    name: '1 - 5',
    columns: ['1', '2', '3', '4', '5'],
    minLabel: 'Sangat Tidak Setuju',
    maxLabel: 'Sangat Setuju',
  },
  {
    id: 'scale_1_7',
    name: '1 - 7',
    columns: ['1', '2', '3', '4', '5', '6', '7'],
    minLabel: 'Sangat Tidak Setuju',
    maxLabel: 'Sangat Setuju',
  },
  {
    id: 'scale_1_10',
    name: '1 - 10',
    columns: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    minLabel: 'Paling Rendah',
    maxLabel: 'Paling Tinggi',
  },
  {
    id: 'satisfaction_4',
    name: 'Kepuasan (4 Tahap)',
    columns: ['Tidak Puas Hati', 'Kurang Puas Hati', 'Puas Hati', 'Sangat Puas Hati'],
  },
  {
    id: 'agreement_4',
    name: 'Persetujuan (4 Tahap)',
    columns: ['Sangat Tidak Setuju', 'Tidak Setuju', 'Setuju', 'Sangat Setuju'],
  },
  {
    id: 'frequency_5',
    name: 'Kekerapan (5 Tahap)',
    columns: ['Tidak Pernah', 'Jarang', 'Kadang-kadang', 'Kerap', 'Sentiasa'],
  },
];

/**
 * Format a grid row key for spreadsheet export and FormData serialization.
 * e.g. "Penilaian Sesi [Penceramah Jelas]"
 */
export function formatGridRowKey(fieldLabel: string, rowStatement: string): string {
  const cleanLabel = (fieldLabel || 'Grid').trim();
  const cleanRow = (rowStatement || '').trim();
  return `${cleanLabel} [${cleanRow}]`;
}

/**
 * Flatten a grid's row answers object into individual key-value pairs.
 * Used when saving to Google Sheets and sending submissions.
 *
 * e.g.
 * answers = { "Penceramah": "5", "Kemudahan": "4" }
 * => { "Penilaian [Penceramah]": "5", "Penilaian [Kemudahan]": "4" }
 */
export function flattenGridResponses(
  fieldOrLabel: FormField | string,
  gridConfigOrAnswers?: GridConfig | Record<string, string> | null,
  maybeAnswers?: Record<string, string> | null
): Record<string, string> {
  let label: string;
  let config: GridConfig | undefined;
  let answers: Record<string, string> | undefined | null;

  if (typeof fieldOrLabel === 'object' && fieldOrLabel !== null) {
    label = fieldOrLabel.label;
    config = fieldOrLabel.gridConfig;
    answers = (gridConfigOrAnswers as Record<string, string> | null) ?? null;
  } else {
    label = fieldOrLabel;
    config = gridConfigOrAnswers as GridConfig | undefined;
    answers = maybeAnswers ?? null;
  }

  const flattened: Record<string, string> = {};
  if (!config || !Array.isArray(config.rows)) {
    return flattened;
  }

  const safeAnswers = answers && typeof answers === 'object' ? answers : {};

  for (const row of config.rows) {
    const key = formatGridRowKey(label, row);
    flattened[key] = safeAnswers[row] !== undefined ? String(safeAnswers[row]) : '';
  }

  return flattened;
}

/**
 * Extract grid answers from a flattened record or JSON payload.
 * Used when prefilling responses in Edit Link mode or loading response tables.
 */
export function unflattenGridResponses(
  field: FormField,
  sourceRecord: Record<string, unknown>
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!field.gridConfig || !Array.isArray(field.gridConfig.rows)) {
    return result;
  }

  // 1. Direct object or JSON string under field.id or field.label
  const rawDirect = sourceRecord[field.id] ?? sourceRecord[field.label];
  if (rawDirect && typeof rawDirect === 'object' && !Array.isArray(rawDirect)) {
    return { ...(rawDirect as Record<string, string>) };
  }
  if (typeof rawDirect === 'string' && rawDirect.startsWith('{') && rawDirect.endsWith('}')) {
    try {
      const parsed = JSON.parse(rawDirect);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, string>;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  // 2. Flattened format: "field.label [row]"
  for (const row of field.gridConfig.rows) {
    const keyWithLabel = formatGridRowKey(field.label, row);
    const keyWithId = formatGridRowKey(field.id, row);

    if (sourceRecord[keyWithLabel] !== undefined) {
      result[row] = String(sourceRecord[keyWithLabel]);
    } else if (sourceRecord[keyWithId] !== undefined) {
      result[row] = String(sourceRecord[keyWithId]);
    }
  }

  return result;
}

/**
 * Check if all rows in a grid have been answered.
 */
export function isGridComplete(
  gridConfig: GridConfig | undefined,
  answers: Record<string, unknown> | undefined | null
): boolean {
  if (!gridConfig || !Array.isArray(gridConfig.rows) || gridConfig.rows.length === 0) {
    return true;
  }
  if (!answers || typeof answers !== 'object') {
    return false;
  }

  return gridConfig.rows.every((row) => {
    const val = (answers as Record<string, unknown>)[row];
    return val !== undefined && val !== null && String(val).trim() !== '';
  });
}

/**
 * Check if at least one row in a grid has been answered.
 */
export function isGridPartiallyFilled(
  answers: Record<string, unknown> | undefined | null
): boolean {
  if (!answers || typeof answers !== 'object') return false;
  return Object.values(answers).some(
    (val) => val !== undefined && val !== null && String(val).trim() !== ''
  );
}
