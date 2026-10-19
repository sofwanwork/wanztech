import { describe, it, expect } from 'vitest';
import { parseScaleGuide } from '@/lib/forms/scale-guide';

describe('parseScaleGuide', () => {
  it('returns null for empty, undefined or regular text', () => {
    expect(parseScaleGuide(undefined)).toBeNull();
    expect(parseScaleGuide('')).toBeNull();
    expect(parseScaleGuide('   ')).toBeNull();
    expect(parseScaleGuide('Bahagian ini berkaitan dengan maklum balas peserta.')).toBeNull();
    expect(parseScaleGuide('Sila jawab soalan 1 - 5 di bawah.')).toBeNull();
  });

  it('correctly parses user-submitted Malay course evaluation scale diagram with intro and trailing labels', () => {
    const raw =
      'Sila nyatakan persepsi anda terhadap kursus yang dihadiri dengan menyatakan SATU NOMBOR berdasarkan skala 1 hingga 6 seperti berikut : 1----------------------------------------------------> 6 Sangat tidak setuju          Sangat Setuju';
    const parsed = parseScaleGuide(raw);

    expect(parsed).not.toBeNull();
    expect(parsed?.min).toBe('1');
    expect(parsed?.max).toBe('6');
    expect(parsed?.intro).toBe(
      'Sila nyatakan persepsi anda terhadap kursus yang dihadiri dengan menyatakan SATU NOMBOR berdasarkan skala 1 hingga 6 seperti berikut :'
    );
    expect(parsed?.minLabel).toBe('Sangat tidak setuju');
    expect(parsed?.maxLabel).toBe('Sangat Setuju');
  });

  it('correctly parses multiline scale diagrams', () => {
    const raw = `Skala penilaian:\n1---------> 5\nTidak Memuaskan          Sangat Memuaskan`;
    const parsed = parseScaleGuide(raw);

    expect(parsed).not.toBeNull();
    expect(parsed?.min).toBe('1');
    expect(parsed?.max).toBe('5');
    expect(parsed?.intro).toBe('Skala penilaian:');
    expect(parsed?.minLabel).toBe('Tidak Memuaskan');
    expect(parsed?.maxLabel).toBe('Sangat Memuaskan');
  });

  it('correctly parses scale with delimiter separated labels (e.g. / or ->)', () => {
    const raw = '1 -----> 10 Rendah / Tinggi';
    const parsed = parseScaleGuide(raw);

    expect(parsed).not.toBeNull();
    expect(parsed?.min).toBe('1');
    expect(parsed?.max).toBe('10');
    expect(parsed?.minLabel).toBe('Rendah');
    expect(parsed?.maxLabel).toBe('Tinggi');
  });

  it('handles scale with no labels', () => {
    const raw = '1 ------> 5';
    const parsed = parseScaleGuide(raw);

    expect(parsed).not.toBeNull();
    expect(parsed?.min).toBe('1');
    expect(parsed?.max).toBe('5');
    expect(parsed?.minLabel).toBeUndefined();
    expect(parsed?.maxLabel).toBeUndefined();
  });
});
