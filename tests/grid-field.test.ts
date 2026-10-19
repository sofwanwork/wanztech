import { describe, it, expect } from 'vitest';
import {
  createDefaultGridConfig,
  formatGridRowKey,
  flattenGridResponses,
  unflattenGridResponses,
  isGridComplete,
  isGridPartiallyFilled,
  GRID_PRESET_SCALES,
} from '@/lib/forms/grid';
import { validateSubmission } from '@/lib/forms/validate-submission';
import type { FormField } from '@/lib/types/forms';

describe('Multiple Choice Grid (Scale) helpers', () => {
  it('creates valid default grid configuration', () => {
    const config = createDefaultGridConfig();
    expect(config.rows).toHaveLength(3);
    expect(config.columns).toEqual(['1', '2', '3', '4', '5']);
    expect(config.minLabel).toBe('Sangat Tidak Setuju');
    expect(config.maxLabel).toBe('Sangat Setuju');
  });

  it('formats row keys consistently', () => {
    expect(formatGridRowKey('Penilaian Sesi', 'Penceramah Jelas')).toBe(
      'Penilaian Sesi [Penceramah Jelas]'
    );
    expect(formatGridRowKey('  Feedback  ', '  Masa  ')).toBe('Feedback [Masa]');
  });

  it('flattens grid responses into individual row keys for Google Sheets', () => {
    const config = createDefaultGridConfig();
    const answers = {
      'Statement 1': '5',
      'Statement 2': '4',
    };

    const flattened = flattenGridResponses('Maklum Balas', config, answers);
    expect(flattened['Maklum Balas [Statement 1]']).toBe('5');
    expect(flattened['Maklum Balas [Statement 2]']).toBe('4');
    expect(flattened['Maklum Balas [Statement 3]']).toBe('');
  });

  it('unflattens responses from flattened records (e.g. Google Sheets snapshot)', () => {
    const field: FormField = {
      id: 'grid_1',
      type: 'grid',
      label: 'Maklum Balas',
      required: true,
      gridConfig: {
        rows: ['S1', 'S2'],
        columns: ['1', '2', '3', '4', '5'],
      },
    };

    const snapshot = {
      'Maklum Balas [S1]': '5',
      'Maklum Balas [S2]': '3',
    };

    const unflattened = unflattenGridResponses(field, snapshot);
    expect(unflattened).toEqual({
      S1: '5',
      S2: '3',
    });
  });

  it('unflattens responses from direct object or JSON string', () => {
    const field: FormField = {
      id: 'grid_1',
      type: 'grid',
      label: 'Rating Grid',
      required: true,
      gridConfig: {
        rows: ['A', 'B'],
        columns: ['1', '2', '3'],
      },
    };

    const objSource = {
      grid_1: { A: '1', B: '2' },
    };
    expect(unflattenGridResponses(field, objSource)).toEqual({ A: '1', B: '2' });

    const jsonSource = {
      'Rating Grid': JSON.stringify({ A: '3', B: '1' }),
    };
    expect(unflattenGridResponses(field, jsonSource)).toEqual({ A: '3', B: '1' });
  });

  it('evaluates isGridComplete and isGridPartiallyFilled correctly', () => {
    const config = createDefaultGridConfig(); // 3 rows
    expect(isGridComplete(config, null)).toBe(false);
    expect(isGridComplete(config, { 'Statement 1': '5' })).toBe(false);
    expect(
      isGridComplete(config, {
        'Statement 1': '5',
        'Statement 2': '4',
        'Statement 3': '3',
      })
    ).toBe(true);

    expect(isGridPartiallyFilled(null)).toBe(false);
    expect(isGridPartiallyFilled({})).toBe(false);
    expect(isGridPartiallyFilled({ 'Statement 1': '5' })).toBe(true);
  });

  it('has presets for common scales (1-5, 1-7, 1-10, satisfaction, etc.)', () => {
    expect(GRID_PRESET_SCALES.length).toBeGreaterThanOrEqual(4);
    const p5 = GRID_PRESET_SCALES.find((p) => p.name.includes('1 - 5'));
    expect(p5?.columns).toEqual(['1', '2', '3', '4', '5']);
  });
});

describe('Multiple Choice Grid validateSubmission integration', () => {
  const gridField: FormField = {
    id: 'f_grid',
    type: 'grid',
    label: 'Penilaian Kursus',
    required: true,
    gridConfig: {
      rows: ['Pengisian', 'Penceramah'],
      columns: ['1', '2', '3', '4', '5'],
    },
  };

  it('rejects when required grid is empty or incomplete', () => {
    const resEmpty = validateSubmission([gridField], {});
    expect(resEmpty.ok).toBe(false);
    expect(resEmpty.error).toContain('Penilaian Kursus requires a response in each row');

    const resIncomplete = validateSubmission([gridField], {
      'Penilaian Kursus [Pengisian]': '5',
    });
    expect(resIncomplete.ok).toBe(false);
    expect(resIncomplete.error).toContain('Penilaian Kursus requires a response in each row');
  });

  it('accepts when all rows are filled via flattened keys', () => {
    const res = validateSubmission([gridField], {
      'Penilaian Kursus [Pengisian]': '5',
      'Penilaian Kursus [Penceramah]': '4',
    });
    expect(res.ok).toBe(true);
    expect(res.error).toBeNull();
  });

  it('accepts optional grid when left completely empty', () => {
    const optionalGrid: FormField = {
      ...gridField,
      required: false,
    };
    const res = validateSubmission([optionalGrid], {});
    expect(res.ok).toBe(true);
  });
});
