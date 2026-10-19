import { describe, it, expect, vi } from 'vitest';
import { sanitizeHeaders, ensureSheetCapacity } from '@/lib/api/google-sheets';

describe('sanitizeHeaders', () => {
  it('trims whitespace from header names', () => {
    const raw = ['  Nama Penuh  ', 'No IC ', '  Email'];
    expect(sanitizeHeaders(raw)).toEqual(['Nama Penuh', 'No IC', 'Email']);
  });

  it('replaces empty or whitespace-only headers with fallback names', () => {
    const raw = ['Nama', '', '   ', 'Email'];
    expect(sanitizeHeaders(raw)).toEqual(['Nama', 'Kolom_2', 'Kolom_3', 'Email']);
  });

  it('disambiguates duplicate headers by adding sequential numeric suffixes', () => {
    const raw = [
      'Pencapaian Objektif',
      'Penyampaian Penceramah',
      'Pencapaian Objektif',
      'Pencapaian Objektif',
    ];
    expect(sanitizeHeaders(raw)).toEqual([
      'Pencapaian Objektif',
      'Penyampaian Penceramah',
      'Pencapaian Objektif (2)',
      'Pencapaian Objektif (3)',
    ]);
  });

  it('handles multiple empty headers without collisions', () => {
    const raw = ['', ''];
    expect(sanitizeHeaders(raw)).toEqual(['Kolom_1', 'Kolom_2']);
  });
});

describe('ensureSheetCapacity', () => {
  it('resizes the sheet when requiredColumns exceeds columnCount (> 26 columns)', async () => {
    const resizeMock = vi.fn().mockResolvedValue(undefined);
    const mockSheet = {
      columnCount: 26,
      rowCount: 1000,
      resize: resizeMock,
    };

    // User form has 35 fields (e.g. 18 scale questions + registration fields)
    await ensureSheetCapacity(mockSheet, 35);

    expect(resizeMock).toHaveBeenCalledTimes(1);
    expect(resizeMock).toHaveBeenCalledWith({
      columnCount: 45, // Math.max(35 + 10, 26 + 10)
      rowCount: 1000,
    });
  });

  it('does not resize if sheet columnCount already accommodates requiredColumns', async () => {
    const resizeMock = vi.fn().mockResolvedValue(undefined);
    const mockSheet = {
      columnCount: 50,
      rowCount: 1000,
      resize: resizeMock,
    };

    await ensureSheetCapacity(mockSheet, 30);

    expect(resizeMock).not.toHaveBeenCalled();
  });

  it('defaults to 26 columns and 1000 rows if sheet properties are missing', async () => {
    const resizeMock = vi.fn().mockResolvedValue(undefined);
    const mockSheet = {
      resize: resizeMock,
    };

    await ensureSheetCapacity(mockSheet, 32);

    expect(resizeMock).toHaveBeenCalledTimes(1);
    expect(resizeMock).toHaveBeenCalledWith({
      columnCount: 42, // Math.max(32 + 10, 26 + 10)
      rowCount: 1000,
    });
  });

  it('safely handles missing resize function without throwing', async () => {
    const mockSheet = {
      columnCount: 20,
    };

    await expect(ensureSheetCapacity(mockSheet, 30)).resolves.not.toThrow();
  });
});

describe('Large Scale Question Form Google Sheet Simulation (18+ Scale Questions)', () => {
  it('generates unique non-colliding headers for 18 scale questions and base fields (> 26 columns)', () => {
    const baseFields = ['timestamp', '_submission_id', 'Nama Penuh', 'No. Kad Pengenalan', 'Emel', 'No. Telefon', 'Agensi / Jabatan'];
    const scaleQuestions = [
      'Pencapaian Objektif Kursus',
      'Kesesuaian Kandungan Kursus',
      'Kaedah Penyampaian Kursus',
      'Pengurusan Masa Kursus',
      'Bahan & Nota Kursus',
      'Pengetahuan Penceramah Berkenaan Topik',
      'Kejelasan Penyampaian Penceramah',
      'Interaksi Penceramah dengan Peserta',
      'Keupayaan Menjawab Soalan',
      'Komitmen & Kesungguhan Penceramah',
      'Kesesuaian Bilik Latihan',
      'Kemudahan Audio & Visual',
      'Makanan & Minuman Disediakan',
      'Sokongan Urus Setia Program',
      'Tahap Pemahaman Selepas Kursus',
      'Kebolehlaksanaan Ilmu di Tempat Kerja',
      'Cadangan Penambahbaikan Modul',
      'Kepuasan Keseluruhan Program',
    ];

    const allKeys = [...baseFields, ...scaleQuestions];
    expect(allKeys.length).toBe(25 + 0); // 7 + 18 = 25

    // If attendance check-in adds columns:
    const attendanceColumns = ['Masa Masuk (Check-In)', 'Masa Keluar (Check-Out)', 'Jumlah Jam (Hours)', 'Status Kehadiran'];
    const totalWithAttendance = [...allKeys, ...attendanceColumns];
    expect(totalWithAttendance.length).toBe(29); // 29 > 26 (A-Z) limit!

    const sanitized = sanitizeHeaders(totalWithAttendance);
    expect(sanitized.length).toBe(29);

    // Ensure no duplicates exist in sanitized output
    const uniqueHeaders = new Set(sanitized);
    expect(uniqueHeaders.size).toBe(29);
  });
});
