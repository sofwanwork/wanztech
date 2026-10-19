import { describe, it, expect } from 'vitest';
import { sanitizeSheetValue } from '@/lib/api/google-sheets';
import { buildDailyCertificateOptions } from '@/lib/forms/attendance';

describe('sanitizeSheetValue', () => {
  it('handles null and undefined', () => {
    expect(sanitizeSheetValue(null)).toBe('');
    expect(sanitizeSheetValue(undefined)).toBe('');
  });

  it('preserves numbers and booleans', () => {
    expect(sanitizeSheetValue(42)).toBe(42);
    expect(sanitizeSheetValue(0)).toBe(0);
    expect(sanitizeSheetValue(true)).toBe(true);
    expect(sanitizeSheetValue(false)).toBe(false);
  });

  it('guards against formula injection', () => {
    expect(sanitizeSheetValue('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeSheetValue('+12345')).toBe("'+12345");
    expect(sanitizeSheetValue('-cmd|calc')).toBe("'-cmd|calc");
    expect(sanitizeSheetValue('@mention')).toBe("'@mention");
  });

  it('keeps normal strings unchanged', () => {
    expect(sanitizeSheetValue('Ali bin Abu')).toBe('Ali bin Abu');
    expect(sanitizeSheetValue('18/10/2026, 08:30 AM')).toBe('18/10/2026, 08:30 AM');
  });
});

describe('Multi-Day Dedicated Sheet Tabs Integration', () => {
  it('maps attendance data from separate day tabs into daily certificate options', () => {
    // Simulating: Sheet 0 has participant info and Hari 1
    // Tab "Hari 2" has participant check-in: Masa Masuk = "18/10/2026, 08:30 AM"
    const sheetRowData: Record<string, string | undefined> = {
      'Nama': 'Ahmad Albab',
      'No. IC': '900101015555',
      'Masa Masuk (Check-In)': '17/10/2026, 08:30 AM',
      // Mapped from Tab "Hari 2"
      'Masa Masuk (Hari 2)': '18/10/2026, 08:30 AM',
      'Masa Keluar (Hari 2)': '18/10/2026, 05:00 PM',
      'Jumlah Jam (Hari 2)': '8.5',
    };

    const options = buildDailyCertificateOptions({
      records: [
        { dayNumber: 1, checkInAt: '2026-10-17T08:30:00.000Z' },
        { dayNumber: 2, checkInAt: '2026-10-19T08:30:00.000Z' }, // Stale DB timestamp
      ],
      sheetRowData,
      totalDays: 2,
    });

    expect(options).toHaveLength(3);

    // Day 1
    expect(options[0].dayNumber).toBe(1);
    expect(options[0].label).toBe('Hari 1');
    expect(options[0].date).toBe('October 17, 2026');

    // Day 2 (Uses date extracted from tab Hari 2)
    expect(options[1].dayNumber).toBe(2);
    expect(options[1].label).toBe('Hari 2');
    expect(options[1].date).toBe('October 18, 2026');
    expect(options[1].formattedDate).toBe('October 18, 2026');

    // Combined option
    expect(options[2].dayNumber).toBe(0);
    expect(options[2].label).toBe('Semua Hari (Penuh)');
    expect(options[2].isCombined).toBe(true);
  });

  it('prioritizes explicit Tarikh column inside day tab over Masa Masuk', () => {
    const sheetRowData: Record<string, string | undefined> = {
      'Masa Masuk (Hari 1)': '17/10/2026, 08:30 AM',
      // Tab "Hari 2" has explicit Tarikh
      'Masa Masuk (Hari 2)': '18/10/2026, 08:30 AM',
      'Tarikh (Hari 2)': '18 Oktober 2026',
    };

    const options = buildDailyCertificateOptions({
      records: [{ dayNumber: 2, checkInAt: '2026-10-19T08:30:00.000Z' }],
      sheetRowData,
      totalDays: 2,
    });

    const day2 = options.find((o) => o.dayNumber === 2);
    expect(day2).toBeDefined();
    expect(day2?.date).toBe('October 18, 2026');
  });

  it('maintains backward compatibility when all days are still on Sheet 0', () => {
    const legacySheetRowData: Record<string, string | undefined> = {
      'Nama': 'Siti Nurhaliza',
      'Masa Masuk (Hari 1)': '07/10/2026, 08:30 AM',
      'Masa Masuk (Hari 2)': '08/10/2026, 08:30 AM',
      'Masa Masuk (Hari 3)': '09/10/2026, 08:30 AM',
    };

    const options = buildDailyCertificateOptions({
      sheetRowData: legacySheetRowData,
      totalDays: 3,
    });

    expect(options).toHaveLength(4); // Day 1, 2, 3 + Combined
    expect(options[0].date).toBe('October 7, 2026');
    expect(options[1].date).toBe('October 8, 2026');
    expect(options[2].date).toBe('October 9, 2026');
    expect(options[3].label).toBe('Semua Hari (Penuh)');
  });
});
