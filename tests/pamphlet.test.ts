import { describe, it, expect } from 'vitest';
import {
  isValidPamphletSlug,
  cleanPamphletSlug,
  getSamplePamphlet,
  getSampleLandscapePamphlet,
  getPamphletOrientation,
} from '@/lib/pamphlets/utils';
import { PAMPHLET_THEMES } from '@/lib/pamphlets/themes';
import { mapPamphletFromRow } from '@/lib/storage/pamphlets';
import { PamphletTheme } from '@/lib/types/pamphlets';

describe('E-Pamphlet — Slug Validation & Cleaning', () => {
  it('accepts valid pamphlet slugs', () => {
    expect(isValidPamphletSlug('hari-guru-2026')).toBe(true);
    expect(isValidPamphletSlug('sukan-tahunan')).toBe(true);
    expect(isValidPamphletSlug('majlis_anugerah_cemerlang')).toBe(true);
    expect(isValidPamphletSlug('buku123')).toBe(true);
  });

  it('rejects invalid pamphlet slugs', () => {
    expect(isValidPamphletSlug('')).toBe(false);
    expect(isValidPamphletSlug('ab')).toBe(false); // too short (<3)
    expect(isValidPamphletSlug('a'.repeat(65))).toBe(false); // too long (>60)
    expect(isValidPamphletSlug('hari guru')).toBe(false); // space
    expect(isValidPamphletSlug('acara@2026')).toBe(false); // special char
    expect(isValidPamphletSlug('-buku-')).toBe(false); // starts/ends with hyphen
  });

  it('cleans raw input into valid slugs', () => {
    expect(cleanPamphletSlug('Majlis Hari Anugerah Cemerlang 2026')).toBe(
      'majlis-hari-anugerah-cemerlang-2026'
    );
    expect(cleanPamphletSlug('  @Kejohanan__Sukan!!  ')).toBe('kejohanan-sukan');
    expect(cleanPamphletSlug('Bengkel Web Dev 101')).toBe('bengkel-web-dev-101');
    expect(cleanPamphletSlug('a'.repeat(80)).length).toBe(60);
  });
});

describe('E-Pamphlet — Themes & Aesthetics', () => {
  const expectedThemes: PamphletTheme[] = ['dark', 'light', 'paper', 'emerald'];

  it('has all 4 core visual themes configured', () => {
    for (const key of expectedThemes) {
      const theme = PAMPHLET_THEMES[key];
      expect(theme).toBeDefined();
      expect(theme.name).toBeTruthy();
      expect(theme.bgClass).toBeTruthy();
      expect(theme.cardBg).toBeTruthy();
      expect(theme.textColor).toBeTruthy();
      expect(theme.accentColor).toBeTruthy();
      expect(theme.toolbarBg).toBeTruthy();
    }
  });
});

describe('E-Pamphlet — Sample Template & DB Mapping', () => {
  it('generates a rich sample pamphlet', () => {
    const sample = getSamplePamphlet();
    expect(sample.slug).toBe('buku-program-anugerah-cemerlang');
    expect(sample.pages.length).toBe(6);
    expect(sample.actionButtons.length).toBeGreaterThan(0);
    expect(sample.displayMode).toBe('flipbook');
    expect(sample.theme).toBe('emerald');
    expect(sample.orientation).toBe('portrait');
  });

  it('generates a rich landscape sample pamphlet', () => {
    const sample = getSampleLandscapePamphlet();
    expect(sample.slug).toBe('buku-program-persidangan-inovasi');
    expect(sample.pages.length).toBe(6);
    expect(sample.orientation).toBe('landscape');
    expect(sample.pages[0].orientation).toBe('landscape');
  });

  it('correctly resolves orientation via getPamphletOrientation', () => {
    expect(getPamphletOrientation({ orientation: 'landscape' })).toBe('landscape');
    expect(getPamphletOrientation({ orientation: 'portrait' })).toBe('portrait');
    expect(getPamphletOrientation({ pages: [{ orientation: 'landscape', id: '1', pageNumber: 1, imageUrl: '' }] })).toBe('landscape');
    expect(getPamphletOrientation()).toBe('portrait');
  });

  it('maps database rows safely with fallbacks', () => {
    const row = {
      id: 'p-123',
      user_id: 'u-456',
      slug: 'acara-sekolah',
      title: null,
      description: null,
      pages: null, // should fallback to []
      action_buttons: null,
      is_active: null, // should fallback to true
      views: null, // should fallback to 0
      created_at: '2026-10-02T00:00:00Z',
      updated_at: '2026-10-02T00:00:00Z',
    };

    const mapped = mapPamphletFromRow(row);
    expect(mapped.id).toBe('p-123');
    expect(mapped.userId).toBe('u-456');
    expect(mapped.title).toBe('');
    expect(mapped.pages).toEqual([]);
    expect(mapped.actionButtons).toEqual([]);
    expect(mapped.isActive).toBe(true);
    expect(mapped.views).toBe(0);
    expect(mapped.orientation).toBe('portrait');
  });
});
