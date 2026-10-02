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
import { PamphletTheme, PamphletPageItem } from '@/lib/types/pamphlets';
import { computeSpread } from '@/components/pamphlet/viewer/flipbook-view';

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

describe('E-Pamphlet — 3D Flipbook computeSpread Logic', () => {
  const dummyPage = (num: number): PamphletPageItem => ({
    id: `page-${num}`,
    pageNumber: num,
    imageUrl: `https://example.com/p${num}.jpg`,
    title: `Halaman ${num}`,
  });

  it('returns all nulls for an empty page list', () => {
    const spread = computeSpread(1, []);
    expect(spread.leftPage).toBeNull();
    expect(spread.rightPage).toBeNull();
    expect(spread.isCover).toBe(false);
    expect(spread.isBackCover).toBe(false);
  });

  it('correctly maps 2-page brochures side-by-side (Page 1 Left, Page 2 Right)', () => {
    const pages = [dummyPage(1), dummyPage(2)];
    const spread = computeSpread(1, pages);
    // Crucial fix: 2-page documents never isolate page 1 to half the screen with an empty left side!
    expect(spread.isCover).toBe(false);
    expect(spread.isBackCover).toBe(false);
    expect(spread.leftPage?.pageNumber).toBe(1);
    expect(spread.rightPage?.pageNumber).toBe(2);
    expect(spread.leftPageNum).toBe(1);
    expect(spread.rightPageNum).toBe(2);
  });

  it('correctly handles multi-page books (Cover, Spreads, Back Cover)', () => {
    const pages = [dummyPage(1), dummyPage(2), dummyPage(3), dummyPage(4)];

    // Page 1: Cover on right
    const coverSpread = computeSpread(1, pages);
    expect(coverSpread.isCover).toBe(true);
    expect(coverSpread.leftPage).toBeNull();
    expect(coverSpread.rightPage?.pageNumber).toBe(1);

    // Page 2 & 3: Inside 2-page spread
    const insideSpread = computeSpread(2, pages);
    expect(insideSpread.isCover).toBe(false);
    expect(insideSpread.isBackCover).toBe(false);
    expect(insideSpread.leftPage?.pageNumber).toBe(2);
    expect(insideSpread.rightPage?.pageNumber).toBe(3);

    // Page 4: Back cover solo on left
    const backCoverSpread = computeSpread(4, pages);
    expect(backCoverSpread.isCover).toBe(false);
    expect(backCoverSpread.isBackCover).toBe(true);
    expect(backCoverSpread.leftPage?.pageNumber).toBe(4);
    expect(backCoverSpread.rightPage).toBeNull();
  });
});

