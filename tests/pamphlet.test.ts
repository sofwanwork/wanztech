import { describe, it, expect } from 'vitest';
import {
  isValidPamphletSlug,
  cleanPamphletSlug,
  getSamplePamphlet,
  getSampleLandscapePamphlet,
  getPamphletOrientation,
} from '@/lib/pamphlets/utils';
import { PAMPHLET_THEMES, DEFAULT_PAMPHLET_THEME } from '@/lib/pamphlets/themes';
import { mapPamphletFromRow } from '@/lib/storage/pamphlets';
import { PamphletTheme, PamphletPageItem } from '@/lib/types/pamphlets';
import { computeSpread, computeBookStageLayout } from '@/components/pamphlet/viewer/flipbook-view';
import {
  computeBookEdgeThickness,
  computeSoloCoverCloseGeometry,
  resolveIsTwoPageSpread,
  formatFlipbookPageLabel,
} from '@/lib/pamphlets/flip-geometry';

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

  it('sets Clean Studio (light) as the system-wide default theme', () => {
    expect(DEFAULT_PAMPHLET_THEME).toBe('light');
    expect(PAMPHLET_THEMES[DEFAULT_PAMPHLET_THEME].name).toBe('Clean Studio');
  });
});

describe('E-Pamphlet — Sample Template & DB Mapping', () => {
  it('generates a rich sample pamphlet', () => {
    const sample = getSamplePamphlet();
    expect(sample.slug).toBe('excellence-awards-program-book');
    expect(sample.pages.length).toBe(6);
    expect(sample.actionButtons.length).toBeGreaterThan(0);
    expect(sample.displayMode).toBe('flipbook');
    expect(sample.theme).toBe('light');
    expect(sample.orientation).toBe('portrait');
  });

  it('generates a rich landscape sample pamphlet', () => {
    const sample = getSampleLandscapePamphlet();
    expect(sample.slug).toBe('digital-innovation-conference-program');
    expect(sample.pages.length).toBe(6);
    expect(sample.theme).toBe('light');
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
    expect(mapped.theme).toBe('light');
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

describe('E-Pamphlet — Responsive 3D Flipbook Spread Mode (Desktop 2-Page, Mobile Portrait 1-Page / Landscape 2-Page)', () => {
  it('always renders 2-page spread on desktop viewports for 2+ pages (no 1-page mode)', () => {
    expect(
      resolveIsTwoPageSpread({ totalPages: 6, viewportWidth: 1280, viewportHeight: 800 })
    ).toBe(true);
    expect(
      resolveIsTwoPageSpread({ totalPages: 2, viewportWidth: 1440, viewportHeight: 900 })
    ).toBe(true);
    expect(
      resolveIsTwoPageSpread({ totalPages: 6, viewportWidth: 768, viewportHeight: 1024 })
    ).toBe(true);
    // Single-page document stays 1-page
    expect(
      resolveIsTwoPageSpread({ totalPages: 1, viewportWidth: 1280, viewportHeight: 800 })
    ).toBe(false);
  });

  it('renders 1-page on mobile vertical (portrait) viewports', () => {
    expect(
      resolveIsTwoPageSpread({ totalPages: 6, viewportWidth: 390, viewportHeight: 844 })
    ).toBe(false);
    expect(
      resolveIsTwoPageSpread({ totalPages: 6, viewportWidth: 375, viewportHeight: 667 })
    ).toBe(false);
    expect(
      resolveIsTwoPageSpread({ totalPages: 6, viewportWidth: 430, viewportHeight: 932 })
    ).toBe(false);
  });

  it('renders 2-page spread on mobile horizontal (landscape) viewports', () => {
    expect(
      resolveIsTwoPageSpread({ totalPages: 6, viewportWidth: 667, viewportHeight: 375 })
    ).toBe(true);
    expect(
      resolveIsTwoPageSpread({ totalPages: 6, viewportWidth: 844, viewportHeight: 390 })
    ).toBe(true);
    expect(
      resolveIsTwoPageSpread({ totalPages: 6, viewportWidth: 568, viewportHeight: 320 })
    ).toBe(true);
  });

  it('respects forceMobile container orientation (builder phone simulator)', () => {
    expect(
      resolveIsTwoPageSpread({
        totalPages: 6,
        viewportWidth: 400,
        viewportHeight: 780,
        forceMobile: true,
      })
    ).toBe(false);
    expect(
      resolveIsTwoPageSpread({
        totalPages: 6,
        viewportWidth: 780,
        viewportHeight: 400,
        forceMobile: true,
      })
    ).toBe(true);
  });

  it('formats flipbook page indicator labels accurately across 1-page and 2-page spreads', () => {
    expect(formatFlipbookPageLabel({ currentPage: 1, totalPages: 6, isTwoPageSpread: true })).toBe('1 / 6');
    expect(formatFlipbookPageLabel({ currentPage: 2, totalPages: 6, isTwoPageSpread: true })).toBe('2-3 / 6');
    expect(formatFlipbookPageLabel({ currentPage: 3, totalPages: 6, isTwoPageSpread: true })).toBe('2-3 / 6');
    expect(formatFlipbookPageLabel({ currentPage: 4, totalPages: 6, isTwoPageSpread: true })).toBe('4-5 / 6');
    expect(formatFlipbookPageLabel({ currentPage: 6, totalPages: 6, isTwoPageSpread: true })).toBe('6 / 6');
    expect(formatFlipbookPageLabel({ currentPage: 5, totalPages: 5, isTwoPageSpread: true })).toBe('4-5 / 5');
    expect(formatFlipbookPageLabel({ currentPage: 1, totalPages: 2, isTwoPageSpread: true })).toBe('1-2 / 2');
    expect(formatFlipbookPageLabel({ currentPage: 2, totalPages: 6, isTwoPageSpread: false })).toBe('2 / 6');
  });
});

describe('E-Pamphlet — Touch Slider & Auto Slider Mechanics', () => {
  it('correctly derives transition direction between page transitions', () => {
    const getDirection = (currentPage: number, prevPage: number) => {
      return currentPage > prevPage ? 1 : -1;
    };

    expect(getDirection(2, 1)).toBe(1); // Moving to next page
    expect(getDirection(3, 2)).toBe(1); // Moving to next page
    expect(getDirection(1, 2)).toBe(-1); // Moving to prev page
    expect(getDirection(2, 3)).toBe(-1); // Moving to prev page
  });

  it('correctly calculates next page in auto-slider loop with wrap-around', () => {
    const getNextAutoSlidePage = (current: number, total: number) => {
      return current >= total ? 1 : current + 1;
    };

    const totalPages = 4;
    expect(getNextAutoSlidePage(1, totalPages)).toBe(2);
    expect(getNextAutoSlidePage(2, totalPages)).toBe(3);
    expect(getNextAutoSlidePage(3, totalPages)).toBe(4);
    // At final page, it must wrap seamlessly back to page 1
    expect(getNextAutoSlidePage(4, totalPages)).toBe(1);
  });

  it('safely clamps slide index within valid bounds', () => {
    const getSafePageIndex = (currentPage: number, totalPages: number) => {
      return Math.max(0, Math.min(totalPages - 1, currentPage - 1));
    };

    const totalPages = 3;
    expect(getSafePageIndex(1, totalPages)).toBe(0);
    expect(getSafePageIndex(2, totalPages)).toBe(1);
    expect(getSafePageIndex(3, totalPages)).toBe(2);
    // Boundary guards
    expect(getSafePageIndex(0, totalPages)).toBe(0);
    expect(getSafePageIndex(99, totalPages)).toBe(2);
    expect(getSafePageIndex(-5, totalPages)).toBe(0);
  });
});

describe('E-Pamphlet — 3D Stage Dynamic Cover Centering & Adaptive Shadow (computeBookStageLayout)', () => {
  it('centers the front cover and restricts shadow to right page on Page 1 of a multi-page two-page spread', () => {
    const layout = computeBookStageLayout({
      isTwoPageSpread: true,
      totalPages: 6,
      currentPage: 1,
      bookWidth: 900,
      pageWidth: 450,
    });

    expect(layout.isFrontCoverSolo).toBe(true);
    expect(layout.isBackCoverSolo).toBe(false);
    expect(layout.isCoverSolo).toBe(true);
    expect(layout.stageShiftX).toBe(-225);
    expect(layout.activeShadowLeft).toBe(450);
    expect(layout.activeShadowWidth).toBe(450);
    expect(layout.showCenterSpine).toBe(false);
  });

  it('expands shadow to full 2-page spread and shows center spine on inside pages', () => {
    const layout = computeBookStageLayout({
      isTwoPageSpread: true,
      totalPages: 6,
      currentPage: 2,
      bookWidth: 900,
      pageWidth: 450,
    });

    expect(layout.isCoverSolo).toBe(false);
    expect(layout.stageShiftX).toBe(0);
    expect(layout.activeShadowLeft).toBe(0);
    expect(layout.activeShadowWidth).toBe(900);
    expect(layout.showCenterSpine).toBe(true);
  });

  it('centers the back cover and restricts shadow to left page on the final page of an even-page book', () => {
    const layout = computeBookStageLayout({
      isTwoPageSpread: true,
      totalPages: 6,
      currentPage: 6,
      bookWidth: 900,
      pageWidth: 450,
    });

    expect(layout.isFrontCoverSolo).toBe(false);
    expect(layout.isBackCoverSolo).toBe(true);
    expect(layout.isCoverSolo).toBe(true);
    expect(layout.stageShiftX).toBe(225);
    expect(layout.activeShadowLeft).toBe(0);
    expect(layout.activeShadowWidth).toBe(450);
    expect(layout.showCenterSpine).toBe(false);
  });

  it('keeps single-page mode unshifted with no center spine', () => {
    const layout = computeBookStageLayout({
      isTwoPageSpread: false,
      totalPages: 6,
      currentPage: 1,
      bookWidth: 450,
      pageWidth: 450,
    });

    expect(layout.isCoverSolo).toBe(false);
    expect(layout.stageShiftX).toBe(0);
    expect(layout.activeShadowLeft).toBe(0);
    expect(layout.activeShadowWidth).toBe(450);
    expect(layout.showCenterSpine).toBe(false);
  });
});

describe('E-Pamphlet — 3D Solo-Cover Close Clipping Geometry (computeSoloCoverCloseGeometry)', () => {
  it('clips the lifted left page along the fold crease when closing to the front cover (2-3 -> 1)', () => {
    const geom = computeSoloCoverCloseGeometry({
      direction: 'back',
      pageWidth: 400,
      pageHeight: 560,
      bookWidth: 800,
      topIntersect: { x: 90, y: 0 },
      sideIntersect: null,
      bottomIntersect: { x: 50, y: 560 },
    });

    // Element x=0 is outer-left, x=400 is spine; peeled outer-left [0..310] / [0..350] is clipped away
    expect(geom.clipPath).toBe(
      'polygon(400.00px 0.00px, 310.00px 0.00px, 350.00px 560.00px, 400.00px 560.00px)'
    );
    expect(geom.flatExtent).toBe(50);
    expect(geom.shadowWidth).toBe(450);
    expect(geom.shadowLeft).toBe(350);
  });

  it('clips the lifted right page along the fold crease when closing to the back cover (4-5 -> 6)', () => {
    const geom = computeSoloCoverCloseGeometry({
      direction: 'forward',
      pageWidth: 400,
      pageHeight: 560,
      bookWidth: 800,
      topIntersect: { x: 90, y: 0 },
      sideIntersect: null,
      bottomIntersect: { x: 50, y: 560 },
    });

    // Element x=0 is spine, x=400 is outer-right; peeled outer-right [90..400] / [50..400] is clipped away
    expect(geom.clipPath).toBe(
      'polygon(0.00px 0.00px, 90.00px 0.00px, 50.00px 560.00px, 0.00px 560.00px)'
    );
    expect(geom.flatExtent).toBe(50);
    expect(geom.shadowLeft).toBe(0);
    expect(geom.shadowWidth).toBe(450);
  });

  it('handles top outer corner peel while keeping the unpeeled bottom corner intact', () => {
    const geom = computeSoloCoverCloseGeometry({
      direction: 'back',
      pageWidth: 400,
      pageHeight: 560,
      bookWidth: 800,
      topIntersect: { x: 340, y: 0 },
      sideIntersect: { x: 400, y: 80 },
      bottomIntersect: null,
    });

    expect(geom.clipPath).toBe(
      'polygon(400.00px 0.00px, 60.00px 0.00px, 0.00px 80.00px, 0.00px 560.00px, 400.00px 560.00px)'
    );
    expect(geom.flatExtent).toBe(340);
    expect(geom.shadowLeft).toBe(60);
    expect(geom.shadowWidth).toBe(740);
  });

  it('handles bottom outer corner peel while keeping the unpeeled top corner intact', () => {
    const geom = computeSoloCoverCloseGeometry({
      direction: 'forward',
      pageWidth: 400,
      pageHeight: 560,
      bookWidth: 800,
      topIntersect: null,
      sideIntersect: { x: 400, y: 470 },
      bottomIntersect: { x: 320, y: 560 },
    });

    expect(geom.clipPath).toBe(
      'polygon(0.00px 0.00px, 400.00px 0.00px, 400.00px 470.00px, 320.00px 560.00px, 0.00px 560.00px)'
    );
    expect(geom.flatExtent).toBe(320);
    expect(geom.shadowLeft).toBe(0);
    expect(geom.shadowWidth).toBe(720);
  });

  it('clamps slightly out-of-bounds intersection points and collapses degenerate end-of-flip frames cleanly', () => {
    const clamped = computeSoloCoverCloseGeometry({
      direction: 'forward',
      pageWidth: 400,
      pageHeight: 560,
      bookWidth: 800,
      topIntersect: { x: -1, y: 0 },
      sideIntersect: null,
      bottomIntersect: { x: 402, y: 561 },
    });
    expect(clamped.clipPath).toBe(
      'polygon(0.00px 0.00px, 0.00px 0.00px, 400.00px 560.00px, 0.00px 560.00px)'
    );
    expect(clamped.flatExtent).toBe(0);
    expect(clamped.shadowLeft).toBe(0);
    expect(clamped.shadowWidth).toBe(400);

    const degenerateBack = computeSoloCoverCloseGeometry({
      direction: 'back',
      pageWidth: 400,
      pageHeight: 560,
      bookWidth: 800,
      topIntersect: null,
      sideIntersect: null,
      bottomIntersect: null,
    });
    expect(degenerateBack.flatExtent).toBe(0);
    expect(degenerateBack.shadowLeft).toBe(400);
    expect(degenerateBack.shadowWidth).toBe(400);
  });
});

describe('E-Pamphlet — Dynamic 3D Outer Paper-Stack Thickness (computeBookEdgeThickness)', () => {
  it('makes right stack thick and left stack thin near the start, and reverses near the end (6-page book)', () => {
    // Page 1 (Front Cover): 0 on left, full stack on right
    const cover = computeBookEdgeThickness({ totalPages: 6, currentPage: 1, isTwoPageSpread: true });
    expect(cover.leftThickness).toBe(0);
    expect(cover.rightThickness).toBe(cover.maxThickness);
    expect(cover.rightThickness).toBeGreaterThanOrEqual(10);

    // Spread 2-3: few pages on left (thin), many pages on right (thick)
    const early = computeBookEdgeThickness({ totalPages: 6, currentPage: 2, isTwoPageSpread: true });
    expect(early.leftThickness).toBe(2);
    expect(early.rightThickness).toBeGreaterThan(early.leftThickness * 3);

    // Spread 4-5: many pages on left (thick), few pages on right (thin)
    const late = computeBookEdgeThickness({ totalPages: 6, currentPage: 4, isTwoPageSpread: true });
    expect(late.leftThickness).toBe(early.rightThickness);
    expect(late.rightThickness).toBe(early.leftThickness);

    // Page 6 (Back Cover): full stack on left, 0 on right
    const back = computeBookEdgeThickness({ totalPages: 6, currentPage: 6, isTwoPageSpread: true });
    expect(back.leftThickness).toBe(back.maxThickness);
    expect(back.rightThickness).toBe(0);
  });

  it('progressively shifts thickness from right to left across a large 20-page book', () => {
    const start = computeBookEdgeThickness({ totalPages: 20, currentPage: 2, isTwoPageSpread: true });
    const mid = computeBookEdgeThickness({ totalPages: 20, currentPage: 10, isTwoPageSpread: true });
    const end = computeBookEdgeThickness({ totalPages: 20, currentPage: 18, isTwoPageSpread: true });

    expect(start.leftThickness).toBeLessThan(mid.leftThickness);
    expect(mid.leftThickness).toBeLessThan(end.leftThickness);
    expect(start.rightThickness).toBeGreaterThan(mid.rightThickness);
    expect(mid.rightThickness).toBeGreaterThan(end.rightThickness);
    expect(mid.leftThickness).toBe(mid.rightThickness);
    expect(start.maxThickness).toBeLessThanOrEqual(18);
  });

  it('handles 1-page, 2-page, odd-page, and single-page vertical modes cleanly', () => {
    expect(
      computeBookEdgeThickness({ totalPages: 1, currentPage: 1, isTwoPageSpread: true })
    ).toEqual({ leftThickness: 0, rightThickness: 0, maxThickness: 0 });

    const twoPage = computeBookEdgeThickness({ totalPages: 2, currentPage: 1, isTwoPageSpread: true });
    expect(twoPage.leftThickness).toBe(2);
    expect(twoPage.rightThickness).toBe(2);

    // Single-page mobile vertical mode: right stack thins down to 0 on the final page
    const mobileFirst = computeBookEdgeThickness({ totalPages: 6, currentPage: 1, isTwoPageSpread: false });
    const mobileMid = computeBookEdgeThickness({ totalPages: 6, currentPage: 3, isTwoPageSpread: false });
    const mobileLast = computeBookEdgeThickness({ totalPages: 6, currentPage: 6, isTwoPageSpread: false });
    expect(mobileFirst.leftThickness).toBe(0);
    expect(mobileFirst.rightThickness).toBeGreaterThan(mobileMid.rightThickness);
    expect(mobileLast.rightThickness).toBe(0);
  });
});



