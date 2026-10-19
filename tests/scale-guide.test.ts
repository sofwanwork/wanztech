import { describe, it, expect } from 'vitest';
import { parseScaleGuide, isScaleLikeOptions, isFieldHorizontal } from '@/lib/forms/scale-guide';

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

describe('isScaleLikeOptions', () => {
  it('identifies user course evaluation rating scale (Lemah, Baik, Sangat Baik, Cemerlang)', () => {
    expect(isScaleLikeOptions(['Lemah', 'Baik', 'Sangat Baik', 'Cemerlang'])).toBe(true);
    expect(isScaleLikeOptions(['Lemah', 'Sederhana', 'Baik', 'Cemerlang'])).toBe(true);
    expect(isScaleLikeOptions(['Sangat Lemah', 'Lemah', 'Sederhana', 'Baik', 'Cemerlang'])).toBe(true);
  });

  it('identifies satisfaction & agreement Likert scales in Malay', () => {
    expect(
      isScaleLikeOptions(['Sangat Tidak Setuju', 'Tidak Setuju', 'Setuju', 'Sangat Setuju'])
    ).toBe(true);
    expect(
      isScaleLikeOptions(['Tidak Memuaskan', 'Kurang Memuaskan', 'Memuaskan', 'Sangat Memuaskan'])
    ).toBe(true);
    expect(
      isScaleLikeOptions(['Sangat Tidak Puas Hati', 'Tidak Puas Hati', 'Puas Hati', 'Sangat Puas Hati'])
    ).toBe(true);
    expect(
      isScaleLikeOptions(['Tidak Pernah', 'Jarang', 'Kadang-kadang', 'Kerap', 'Sentiasa'])
    ).toBe(true);
    expect(isScaleLikeOptions(['Rendah', 'Sederhana', 'Tinggi'])).toBe(true);
  });

  it('identifies English Likert & rating scales', () => {
    expect(isScaleLikeOptions(['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'])).toBe(true);
    expect(
      isScaleLikeOptions(['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'])
    ).toBe(true);
    expect(isScaleLikeOptions(['Low', 'Medium', 'High'])).toBe(true);
  });

  it('identifies numeric and numbered rating scales', () => {
    expect(isScaleLikeOptions(['1', '2', '3', '4', '5'])).toBe(true);
    expect(isScaleLikeOptions(['0', '1', '2', '3', '4', '5'])).toBe(true);
    expect(isScaleLikeOptions(['1 - Rendah', '2 - Sederhana', '3 - Tinggi'])).toBe(true);
  });

  it('identifies binary polarity choices (Ya/Tidak, Yes/No)', () => {
    expect(isScaleLikeOptions(['Ya', 'Tidak'])).toBe(true);
    expect(isScaleLikeOptions(['Yes', 'No'])).toBe(true);
  });

  it('returns false for non-scale options such as lists of states or departments', () => {
    expect(isScaleLikeOptions(['Johor', 'Selangor', 'Perak', 'Kedah'])).toBe(false);
    expect(isScaleLikeOptions(['Kewangan', 'Operasi', 'Teknologi'])).toBe(false);
    expect(isScaleLikeOptions(['Pilihan A', 'Pilihan B', 'Pilihan C'])).toBe(false);
  });

  it('returns false for invalid counts or excessively long descriptions', () => {
    expect(isScaleLikeOptions(undefined)).toBe(false);
    expect(isScaleLikeOptions([])).toBe(false);
    expect(isScaleLikeOptions(['Single Choice'])).toBe(false);
    expect(
      isScaleLikeOptions([
        '1', '2', '3', '4', '5', '6', '7', '8' // > 7 options
      ])
    ).toBe(false);
    expect(
      isScaleLikeOptions([
        'Saya bersetuju sepenuhnya dengan semua peraturan yang dinyatakan di atas tanpa sebarang bantahan',
        'Saya tidak bersetuju',
      ])
    ).toBe(false);
  });
});

describe('isFieldHorizontal', () => {
  it('prioritizes explicit optionsLayout="horizontal" regardless of choice names', () => {
    expect(
      isFieldHorizontal({
        optionsLayout: 'horizontal',
        options: ['Johor', 'Selangor'],
      })
    ).toBe(true);
  });

  it('prioritizes explicit optionsLayout="vertical" even for rating scales', () => {
    expect(
      isFieldHorizontal({
        optionsLayout: 'vertical',
        options: ['Lemah', 'Baik', 'Sangat Baik', 'Cemerlang'],
      })
    ).toBe(false);
  });

  it('falls back to smart scale detection when optionsLayout is not set', () => {
    expect(
      isFieldHorizontal({
        options: ['Lemah', 'Baik', 'Sangat Baik', 'Cemerlang'],
      })
    ).toBe(true);
    expect(
      isFieldHorizontal({
        options: ['Johor', 'Selangor', 'Perak'],
      })
    ).toBe(false);
  });

  it('handles null/undefined gracefully', () => {
    expect(isFieldHorizontal(null)).toBe(false);
    expect(isFieldHorizontal(undefined)).toBe(false);
    expect(isFieldHorizontal({})).toBe(false);
  });
});
