import { describe, it, expect } from 'vitest';
import {
  CERTIFICATE_PRESETS,
  getPresetById,
  resolvePresetForOrientation,
} from '@/lib/certificates/presets';
import { alignElements, distributeElements } from '@/lib/certificates/alignment';
import { CertificateElement } from '@/lib/types';

describe('Certificate Starter Presets', () => {
  it('should define all 6 starter presets with required fields', () => {
    expect(CERTIFICATE_PRESETS.length).toBe(6);

    const expectedIds = [
      'blank',
      'royal-gold',
      'corporate-blue',
      'academic-classic',
      'modern-training',
      'luxury-dark',
    ];

    expectedIds.forEach((id) => {
      const preset = getPresetById(id);
      expect(preset).toBeDefined();
      expect(preset?.name).toBeTruthy();
      expect(preset?.description).toBeTruthy();
      expect(preset?.category).toBeTruthy();
      expect(preset?.width).toBeGreaterThanOrEqual(800);
      expect(preset?.height).toBeGreaterThanOrEqual(500);
      expect(preset?.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset?.elements.length).toBeGreaterThan(0);
    });
  });

  it('should ensure all elements within each preset have unique IDs and valid coordinates', () => {
    CERTIFICATE_PRESETS.forEach((preset) => {
      const ids = preset.elements.map((el) => el.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      preset.elements.forEach((el) => {
        expect(el.x).toBeGreaterThanOrEqual(0);
        expect(el.x).toBeLessThanOrEqual(preset.width);
        expect(el.y).toBeGreaterThanOrEqual(0);
        expect(el.y).toBeLessThanOrEqual(preset.height);
      });
    });
  });

  it('should return undefined for unknown preset ID', () => {
    expect(getPresetById('non-existent-preset')).toBeUndefined();
  });

  it('should keep landscape presets unchanged when landscape orientation is selected', () => {
    const preset = getPresetById('royal-gold')!;
    const resolved = resolvePresetForOrientation(preset, 'landscape');
    expect(resolved.width).toBe(1123);
    expect(resolved.height).toBe(794);
    expect(resolved.elements).toBe(preset.elements);
  });

  it('should cleanly adapt all 6 starter presets into A4 portrait bounds without overflow', () => {
    CERTIFICATE_PRESETS.forEach((preset) => {
      const portrait = resolvePresetForOrientation(preset, 'portrait');
      expect(portrait.width).toBe(794);
      expect(portrait.height).toBe(1123);
      expect(portrait.elements.length).toBe(preset.elements.length);

      portrait.elements.forEach((el) => {
        expect(el.x).toBeGreaterThanOrEqual(0);
        expect(el.x).toBeLessThanOrEqual(portrait.width);
        expect(el.y).toBeGreaterThanOrEqual(0);
        expect(el.y).toBeLessThanOrEqual(portrait.height);
        expect(el.width).toBeLessThanOrEqual(portrait.width);
        expect(el.height).toBeLessThanOrEqual(portrait.height);
      });
    });

    // Full-frame border preserves 80px inset margin in portrait
    const royalPortrait = resolvePresetForOrientation(getPresetById('royal-gold')!, 'portrait');
    const outerBorder = royalPortrait.elements.find((e) => e.id === 'outer-border')!;
    expect(outerBorder.width).toBe(714);
    expect(outerBorder.height).toBe(1043);
    expect(outerBorder.x).toBe(397);
    expect(outerBorder.y).toBe(562);

    // Full-width horizontal bar adapts cleanly to portrait width
    const corpPortrait = resolvePresetForOrientation(getPresetById('corporate-blue')!, 'portrait');
    const topBar = corpPortrait.elements.find((e) => e.id === 'top-bar')!;
    const bottomBar = corpPortrait.elements.find((e) => e.id === 'bottom-bar')!;
    expect(topBar.width).toBe(794);
    expect(bottomBar.width).toBe(794);
    expect(bottomBar.y).toBeGreaterThan(1100);

    // Full-height left accent stripe extends across full portrait height
    const trainingPortrait = resolvePresetForOrientation(
      getPresetById('modern-training')!,
      'portrait'
    );
    const leftStripe = trainingPortrait.elements.find((e) => e.id === 'left-border-accent')!;
    expect(leftStripe.height).toBe(1123);
    expect(leftStripe.width).toBe(14);
    expect(leftStripe.x).toBe(15);
  });
});

describe('Certificate Element Alignment & Distribution', () => {
  const dummyElements: CertificateElement[] = [
    { id: 'el-1', type: 'text', x: 100, y: 50, width: 100, height: 40 },
    { id: 'el-2', type: 'text', x: 300, y: 150, width: 100, height: 40 },
    { id: 'el-3', type: 'text', x: 500, y: 250, width: 100, height: 40 },
    { id: 'el-unselected', type: 'text', x: 999, y: 999, width: 50, height: 50 },
  ];

  it('should align elements to the left (min x)', () => {
    const aligned = alignElements(dummyElements, ['el-1', 'el-2', 'el-3'], 'left');
    expect(aligned.find((e) => e.id === 'el-1')?.x).toBe(100);
    expect(aligned.find((e) => e.id === 'el-2')?.x).toBe(100);
    expect(aligned.find((e) => e.id === 'el-3')?.x).toBe(100);
    expect(aligned.find((e) => e.id === 'el-unselected')?.x).toBe(999);
  });

  it('should align elements to the center (average x)', () => {
    const aligned = alignElements(dummyElements, ['el-1', 'el-2', 'el-3'], 'center');
    // Average of 100, 300, 500 = 300
    expect(aligned.find((e) => e.id === 'el-1')?.x).toBe(300);
    expect(aligned.find((e) => e.id === 'el-2')?.x).toBe(300);
    expect(aligned.find((e) => e.id === 'el-3')?.x).toBe(300);
  });

  it('should align elements to the right (max x)', () => {
    const aligned = alignElements(dummyElements, ['el-1', 'el-2', 'el-3'], 'right');
    expect(aligned.find((e) => e.id === 'el-1')?.x).toBe(500);
    expect(aligned.find((e) => e.id === 'el-2')?.x).toBe(500);
    expect(aligned.find((e) => e.id === 'el-3')?.x).toBe(500);
  });

  it('should align elements to the top (min y)', () => {
    const aligned = alignElements(dummyElements, ['el-1', 'el-2', 'el-3'], 'top');
    expect(aligned.find((e) => e.id === 'el-1')?.y).toBe(50);
    expect(aligned.find((e) => e.id === 'el-2')?.y).toBe(50);
    expect(aligned.find((e) => e.id === 'el-3')?.y).toBe(50);
  });

  it('should align elements to the middle (average y)', () => {
    const aligned = alignElements(dummyElements, ['el-1', 'el-2', 'el-3'], 'middle');
    // Average of 50, 150, 250 = 150
    expect(aligned.find((e) => e.id === 'el-1')?.y).toBe(150);
    expect(aligned.find((e) => e.id === 'el-2')?.y).toBe(150);
    expect(aligned.find((e) => e.id === 'el-3')?.y).toBe(150);
  });

  it('should align elements to the bottom (max y)', () => {
    const aligned = alignElements(dummyElements, ['el-1', 'el-2', 'el-3'], 'bottom');
    expect(aligned.find((e) => e.id === 'el-1')?.y).toBe(250);
    expect(aligned.find((e) => e.id === 'el-2')?.y).toBe(250);
    expect(aligned.find((e) => e.id === 'el-3')?.y).toBe(250);
  });

  it('should do nothing if fewer than 2 elements are selected for alignment', () => {
    const res = alignElements(dummyElements, ['el-1'], 'center');
    expect(res).toBe(dummyElements);
  });

  it('should evenly distribute elements horizontally', () => {
    // el-1: 100, el-2: 200, el-3: 500
    const unsorted: CertificateElement[] = [
      { id: 'el-1', type: 'text', x: 100, y: 0, width: 10, height: 10 },
      { id: 'el-2', type: 'text', x: 200, y: 0, width: 10, height: 10 },
      { id: 'el-3', type: 'text', x: 500, y: 0, width: 10, height: 10 },
    ];
    // Between 100 and 500 with 3 items, step is (500-100)/2 = 200 => 100, 300, 500
    const distributed = distributeElements(unsorted, ['el-1', 'el-2', 'el-3'], 'horizontal');
    expect(distributed.find((e) => e.id === 'el-1')?.x).toBe(100);
    expect(distributed.find((e) => e.id === 'el-2')?.x).toBe(300);
    expect(distributed.find((e) => e.id === 'el-3')?.x).toBe(500);
  });

  it('should evenly distribute elements vertically', () => {
    const unsorted: CertificateElement[] = [
      { id: 'el-1', type: 'text', x: 0, y: 100, width: 10, height: 10 },
      { id: 'el-2', type: 'text', x: 0, y: 120, width: 10, height: 10 },
      { id: 'el-3', type: 'text', x: 0, y: 700, width: 10, height: 10 },
    ];
    // (700-100)/2 = 300 => 100, 400, 700
    const distributed = distributeElements(unsorted, ['el-1', 'el-2', 'el-3'], 'vertical');
    expect(distributed.find((e) => e.id === 'el-1')?.y).toBe(100);
    expect(distributed.find((e) => e.id === 'el-2')?.y).toBe(400);
    expect(distributed.find((e) => e.id === 'el-3')?.y).toBe(700);
  });

  it('should do nothing if fewer than 3 elements are selected for distribution', () => {
    const res = distributeElements(dummyElements, ['el-1', 'el-2'], 'horizontal');
    expect(res).toBe(dummyElements);
  });
});
