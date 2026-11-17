import { describe, it, expect } from 'vitest';
import { FORM_BACKGROUND_PATTERNS, getFormPatternStyle } from '@/lib/forms/patterns';

describe('Form Background Patterns', () => {
  it('exposes exactly 8 curated modern patterns', () => {
    expect(FORM_BACKGROUND_PATTERNS).toHaveLength(8);

    const ids = FORM_BACKGROUND_PATTERNS.map((p) => p.id);
    expect(ids).toEqual([
      'none',
      'dots',
      'grid',
      'diagonal',
      'crosses',
      'circles',
      'topography',
      'stars',
    ]);

    // Legacy 'waves' and 'triangles' must not be in the selectable options
    expect(ids).not.toContain('waves');
    expect(ids).not.toContain('triangles');
  });

  it('provides non-empty labels and preview styles for every pattern', () => {
    for (const pattern of FORM_BACKGROUND_PATTERNS) {
      expect(pattern.label).toBeTruthy();
      expect(pattern.previewStyle).toBeDefined();

      if (pattern.id === 'none') {
        expect(pattern.previewStyle.backgroundColor).toBe('#f1f5f9');
      } else {
        expect(pattern.previewStyle.backgroundImage).toBeTruthy();
      }
    }
  });

  it('returns empty style for none, null, or undefined', () => {
    expect(getFormPatternStyle('none')).toEqual({});
    expect(getFormPatternStyle(null)).toEqual({});
    expect(getFormPatternStyle(undefined)).toEqual({});
    expect(getFormPatternStyle('')).toEqual({});
  });

  it('generates correct CSS for modern patterns', () => {
    const crosses = getFormPatternStyle('crosses');
    expect(crosses.backgroundImage).toContain('data:image/svg+xml');
    expect(crosses.backgroundImage).toContain('%3Cpath');
    expect(crosses.backgroundSize).toBe('24px 24px');

    const topography = getFormPatternStyle('topography');
    expect(topography.backgroundImage).toContain('data:image/svg+xml');
    expect(topography.backgroundSize).toBe('80px 80px');

    const stars = getFormPatternStyle('stars');
    expect(stars.backgroundImage).toContain('data:image/svg+xml');
    expect(stars.backgroundSize).toBe('48px 48px');
  });

  it('gracefully handles legacy waves and triangles with seamless fallbacks', () => {
    const legacyWaves = getFormPatternStyle('waves');
    const topography = getFormPatternStyle('topography');
    expect(legacyWaves).toEqual(topography);

    const legacyTriangles = getFormPatternStyle('triangles');
    const crosses = getFormPatternStyle('crosses');
    expect(legacyTriangles).toEqual(crosses);
  });
});
