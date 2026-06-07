import { describe, it, expect } from 'vitest';
import {
  resolveCategoryTemplateId,
  collectTemplateIds,
} from '@/lib/certificates/category';

const config = {
  fieldId: 'f-cat',
  map: { Urusetia: 't-staff', Penganjur: 't-org', Peserta: 't-participant' },
};

describe('resolveCategoryTemplateId', () => {
  it('returns the mapped template for a matching category', () => {
    expect(resolveCategoryTemplateId(config, 'Penganjur', 't-default')).toBe('t-org');
    expect(resolveCategoryTemplateId(config, 'Peserta', 't-default')).toBe(
      't-participant'
    );
  });

  it('falls back to default when the category has no mapping', () => {
    expect(resolveCategoryTemplateId(config, 'VIP', 't-default')).toBe('t-default');
  });

  it('falls back to default when category is empty/missing', () => {
    expect(resolveCategoryTemplateId(config, '', 't-default')).toBe('t-default');
    expect(resolveCategoryTemplateId(config, undefined, 't-default')).toBe('t-default');
    expect(resolveCategoryTemplateId(config, null, 't-default')).toBe('t-default');
  });

  it('trims whitespace before matching', () => {
    expect(resolveCategoryTemplateId(config, '  Urusetia  ', 't-default')).toBe(
      't-staff'
    );
  });

  it('falls back to default when no config is set', () => {
    expect(resolveCategoryTemplateId(undefined, 'Penganjur', 't-default')).toBe(
      't-default'
    );
  });

  it('returns undefined when neither a mapping nor a default exists', () => {
    expect(resolveCategoryTemplateId(undefined, 'X', undefined)).toBeUndefined();
  });
});

describe('collectTemplateIds', () => {
  it('includes the default plus every mapped template, de-duplicated', () => {
    const ids = collectTemplateIds(config, 't-default');
    expect(ids).toContain('t-default');
    expect(ids).toContain('t-staff');
    expect(ids).toContain('t-org');
    expect(ids).toContain('t-participant');
    expect(ids).toHaveLength(4);
  });

  it('de-duplicates when default is also a mapped template', () => {
    const ids = collectTemplateIds({ fieldId: 'f', map: { A: 't-default' } }, 't-default');
    expect(ids).toEqual(['t-default']);
  });

  it('returns empty when nothing is configured', () => {
    expect(collectTemplateIds(undefined, undefined)).toEqual([]);
  });
});
