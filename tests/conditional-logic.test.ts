import { describe, it, expect } from 'vitest';
import {
  evaluateConditional,
  evaluateRule,
  normalizeConditional,
  operatorNeedsValue,
} from '@/lib/forms/conditions';
import type { FormField } from '@/lib/types/forms';

const f = (id: string, partial: Partial<FormField> = {}): FormField => ({
  id,
  type: 'text',
  label: id,
  required: false,
  ...partial,
});

describe('normalizeConditional', () => {
  it('returns null for missing config', () => {
    expect(normalizeConditional(undefined)).toBeNull();
    expect(normalizeConditional(null)).toBeNull();
    expect(normalizeConditional({})).toBeNull();
  });

  it('upgrades legacy {fieldId, value} into a single equals rule', () => {
    const out = normalizeConditional({ fieldId: 'q1', value: 'yes' });
    expect(out).toEqual({
      rules: [{ fieldId: 'q1', operator: 'equals', value: 'yes' }],
      logic: 'all',
    });
  });

  it('uses new rules array when provided, ignoring legacy keys', () => {
    const out = normalizeConditional({
      fieldId: 'legacy',
      value: 'ignored',
      rules: [{ fieldId: 'q2', operator: 'gt', value: '5' }],
      logic: 'any',
    });
    expect(out).toEqual({
      rules: [{ fieldId: 'q2', operator: 'gt', value: '5' }],
      logic: 'any',
    });
  });

  it('drops malformed rules with no fieldId', () => {
    const out = normalizeConditional({
      // @ts-expect-error — intentionally malformed
      rules: [{ operator: 'equals', value: 'x' }, { fieldId: 'ok', operator: 'equals', value: 'y' }],
    });
    expect(out?.rules).toHaveLength(1);
    expect(out?.rules[0].fieldId).toBe('ok');
  });

  it('returns null when rules array exists but is fully empty', () => {
    expect(normalizeConditional({ rules: [] })).toBeNull();
  });
});

describe('evaluateRule', () => {
  it('equals / not_equals — string compare', () => {
    expect(evaluateRule({ fieldId: 'q1', operator: 'equals', value: 'yes' }, { q1: 'yes' })).toBe(true);
    expect(evaluateRule({ fieldId: 'q1', operator: 'equals', value: 'yes' }, { q1: 'no' })).toBe(false);
    expect(evaluateRule({ fieldId: 'q1', operator: 'not_equals', value: 'yes' }, { q1: 'no' })).toBe(true);
  });

  it('contains / not_contains — case-insensitive substring', () => {
    expect(evaluateRule({ fieldId: 'q1', operator: 'contains', value: 'klik' }, { q1: 'KlikForm' })).toBe(true);
    expect(evaluateRule({ fieldId: 'q1', operator: 'not_contains', value: 'foo' }, { q1: 'KlikForm' })).toBe(true);
  });

  it('is_empty / is_not_empty — value is irrelevant', () => {
    expect(evaluateRule({ fieldId: 'q1', operator: 'is_empty' }, { q1: '' })).toBe(true);
    expect(evaluateRule({ fieldId: 'q1', operator: 'is_empty' }, { q1: 'something' })).toBe(false);
    expect(evaluateRule({ fieldId: 'q1', operator: 'is_not_empty' }, { q1: 'x' })).toBe(true);
    expect(evaluateRule({ fieldId: 'q1', operator: 'is_not_empty' }, {})).toBe(false);
  });

  it('gt / lt — numeric compare with NaN safety', () => {
    expect(evaluateRule({ fieldId: 'q1', operator: 'gt', value: '5' }, { q1: '10' })).toBe(true);
    expect(evaluateRule({ fieldId: 'q1', operator: 'gt', value: '5' }, { q1: '3' })).toBe(false);
    expect(evaluateRule({ fieldId: 'q1', operator: 'lt', value: '5' }, { q1: '3' })).toBe(true);
    // NaN — both sides must be parseable, otherwise rule fails (false)
    expect(evaluateRule({ fieldId: 'q1', operator: 'gt', value: '5' }, { q1: 'abc' })).toBe(false);
  });

  it('coerces arrays (checkbox values) to comma-joined strings', () => {
    expect(evaluateRule({ fieldId: 'q1', operator: 'contains', value: 'apple' }, { q1: ['banana', 'apple'] })).toBe(true);
  });
});

describe('evaluateConditional', () => {
  const fields = [f('q1'), f('q2'), f('target')];

  it('returns true when no condition is configured', () => {
    expect(evaluateConditional(f('target'), {}, fields)).toBe(true);
  });

  it('honours legacy single-rule shape', () => {
    const target = f('target', { conditional: { fieldId: 'q1', value: 'yes' } });
    expect(evaluateConditional(target, { q1: 'yes' }, fields)).toBe(true);
    expect(evaluateConditional(target, { q1: 'no' }, fields)).toBe(false);
  });

  it('all-logic: every rule must match', () => {
    const target = f('target', {
      conditional: {
        rules: [
          { fieldId: 'q1', operator: 'equals', value: 'yes' },
          { fieldId: 'q2', operator: 'gt', value: '5' },
        ],
        logic: 'all',
      },
    });
    expect(evaluateConditional(target, { q1: 'yes', q2: '10' }, fields)).toBe(true);
    expect(evaluateConditional(target, { q1: 'yes', q2: '3' }, fields)).toBe(false);
    expect(evaluateConditional(target, { q1: 'no', q2: '10' }, fields)).toBe(false);
  });

  it('any-logic: at least one rule must match', () => {
    const target = f('target', {
      conditional: {
        rules: [
          { fieldId: 'q1', operator: 'equals', value: 'yes' },
          { fieldId: 'q2', operator: 'gt', value: '5' },
        ],
        logic: 'any',
      },
    });
    expect(evaluateConditional(target, { q1: 'no', q2: '10' }, fields)).toBe(true);
    expect(evaluateConditional(target, { q1: 'no', q2: '3' }, fields)).toBe(false);
  });

  it('fails open (visible) when a rule references a field that no longer exists', () => {
    const target = f('target', {
      conditional: {
        rules: [{ fieldId: 'deleted-field', operator: 'equals', value: 'x' }],
      },
    });
    expect(evaluateConditional(target, {}, fields)).toBe(true);
  });
});

describe('operatorNeedsValue', () => {
  it('false for empty/non-empty operators', () => {
    expect(operatorNeedsValue('is_empty')).toBe(false);
    expect(operatorNeedsValue('is_not_empty')).toBe(false);
  });

  it('true for value-bearing operators', () => {
    expect(operatorNeedsValue('equals')).toBe(true);
    expect(operatorNeedsValue('contains')).toBe(true);
    expect(operatorNeedsValue('gt')).toBe(true);
  });
});
