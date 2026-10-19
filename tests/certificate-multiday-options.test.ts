import { describe, it, expect } from 'vitest';
import {
  buildDailyCertificateOptions,
  formatAttendanceDate,
  parseSheetDayColumn,
} from '@/lib/forms/attendance';

describe('formatAttendanceDate', () => {
  it('formats Date object to readable date in Asia/Kuala_Lumpur', () => {
    const d = new Date('2026-10-07T08:38:00.000Z');
    const formatted = formatAttendanceDate(d);
    expect(formatted).toBe('October 7, 2026');
  });

  it('formats ISO string in Asia/Kuala_Lumpur', () => {
    const formatted = formatAttendanceDate('2026-10-07T08:38:00.000Z');
    expect(formatted).toBe('October 7, 2026');
  });

  it('formats Malaysian DD/MM/YYYY string', () => {
    const formatted = formatAttendanceDate('07/10/2026');
    expect(formatted).toBe('October 7, 2026');
  });

  it('strips time from DD/MM/YYYY, HH:MM AM/PM strings from Google Sheet cells', () => {
    const formatted = formatAttendanceDate('18/10/2026, 04:15 PM');
    expect(formatted).toBe('October 18, 2026');
  });

  it('strips space-separated 24h time without comma', () => {
    const formatted = formatAttendanceDate('18/10/2026 16:30:00');
    expect(formatted).toBe('October 18, 2026');
  });

  it('formats hyphenated DD-MM-YYYY and dotted DD.MM.YYYY', () => {
    expect(formatAttendanceDate('18-10-2026')).toBe('October 18, 2026');
    expect(formatAttendanceDate('18.10.2026')).toBe('October 18, 2026');
  });

  it('formats YYYY-MM-DD ISO date string', () => {
    expect(formatAttendanceDate('2026-10-18')).toBe('October 18, 2026');
  });

  it('formats Malay month names (Oktober, Mei, Disember)', () => {
    expect(formatAttendanceDate('18 Oktober 2026')).toBe('October 18, 2026');
    expect(formatAttendanceDate('18hb Oktober 2026')).toBe('October 18, 2026');
    expect(formatAttendanceDate('15 Mei 2026')).toBe('May 15, 2026');
    expect(formatAttendanceDate('25 Disember 2026')).toBe('December 25, 2026');
  });

  it('returns raw string when not parseable (e.g. multi-day range text)', () => {
    const formatted = formatAttendanceDate('7 & 8 Oktober 2026');
    expect(formatted).toBe('7 & 8 Oktober 2026');
  });

  it('returns empty string for empty or null inputs', () => {
    expect(formatAttendanceDate('')).toBe('');
    expect(formatAttendanceDate('-')).toBe('');
    expect(formatAttendanceDate(null)).toBe('');
    expect(formatAttendanceDate(undefined)).toBe('');
  });
});

describe('parseSheetDayColumn', () => {
  it('identifies day number and priority for attendance columns', () => {
    expect(parseSheetDayColumn('Masa Masuk (Hari 2)')).toEqual({ dayNumber: 2, priority: 20 });
    expect(parseSheetDayColumn('Masa Keluar (Hari 2)')).toEqual({ dayNumber: 2, priority: 10 });
    expect(parseSheetDayColumn('Tarikh (Hari 2)')).toEqual({ dayNumber: 2, priority: 30 });
    expect(parseSheetDayColumn('Date Day 2')).toEqual({ dayNumber: 2, priority: 30 });
    expect(parseSheetDayColumn('Tarikh Hari 2')).toEqual({ dayNumber: 2, priority: 30 });
    expect(parseSheetDayColumn('Hari 2')).toEqual({ dayNumber: 2, priority: 5 });
  });

  it('identifies Day 1 columns without explicit day number', () => {
    expect(parseSheetDayColumn('Masa Masuk')).toEqual({ dayNumber: 1, priority: 20 });
    expect(parseSheetDayColumn('Masa Keluar')).toEqual({ dayNumber: 1, priority: 10 });
    expect(parseSheetDayColumn('Check In')).toEqual({ dayNumber: 1, priority: 20 });
    expect(parseSheetDayColumn('Check Out')).toEqual({ dayNumber: 1, priority: 10 });
  });

  it('excludes summary duration columns', () => {
    expect(parseSheetDayColumn('Jumlah Jam (Hari 2)')).toBeNull();
    expect(parseSheetDayColumn('Jumlah Jam Keseluruhan (Total Hours)')).toBeNull();
    expect(parseSheetDayColumn('Jumlah Masa Hadir')).toBeNull();
    expect(parseSheetDayColumn('Status Kehadiran')).toBeNull();
  });
});

describe('buildDailyCertificateOptions', () => {
  it('returns single day certificate when only 1 record exists and totalDays is 1', () => {
    const options = buildDailyCertificateOptions({
      records: [
        {
          dayNumber: 1,
          checkInAt: '2026-10-07T08:38:00.000Z',
          status: 'completed',
        },
      ],
      totalDays: 1,
      defaultDate: '2026-10-07',
    });

    expect(options).toHaveLength(1);
    expect(options[0].dayNumber).toBe(1);
    expect(options[0].label).toBe('Hari 1');
    expect(options[0].date).toBe('October 7, 2026');
    expect(options[0].isCombined).toBe(false);
  });

  it('returns day-by-day certificates and combined certificate when participant attended 2 days', () => {
    const options = buildDailyCertificateOptions({
      records: [
        {
          dayNumber: 1,
          checkInAt: '2026-10-07T08:38:00.000Z',
          status: 'completed',
        },
        {
          dayNumber: 2,
          checkInAt: '2026-10-08T10:51:00.000Z',
          status: 'completed',
        },
      ],
      totalDays: 2,
      defaultDate: '7 & 8 Oktober 2026',
    });

    expect(options).toHaveLength(3);

    // Day 1
    expect(options[0].dayNumber).toBe(1);
    expect(options[0].label).toBe('Hari 1');
    expect(options[0].date).toBe('October 7, 2026');

    // Day 2
    expect(options[1].dayNumber).toBe(2);
    expect(options[1].label).toBe('Hari 2');
    expect(options[1].date).toBe('October 8, 2026');

    // Combined All Days
    expect(options[2].dayNumber).toBe(0);
    expect(options[2].label).toBe('Semua Hari (Penuh)');
    expect(options[2].date).toBe('7 & 8 Oktober 2026');
    expect(options[2].isCombined).toBe(true);
  });

  it('extracts daily options from Google Sheet headers when DB records are empty', () => {
    const options = buildDailyCertificateOptions({
      records: [],
      sheetRowData: {
        'Masa Masuk (Hari 1)': '07/10/2026, 8:38 AM',
        'Masa Masuk (Hari 2)': '08/10/2026, 10:51 AM',
      },
      totalDays: 2,
      defaultDate: '7 - 8 Oktober 2026',
    });

    expect(options).toHaveLength(3);
    expect(options[0].label).toBe('Hari 1');
    expect(options[0].date).toBe('October 7, 2026');
    expect(options[1].label).toBe('Hari 2');
    expect(options[1].date).toBe('October 8, 2026');
    expect(options[2].label).toBe('Semua Hari (Penuh)');
    expect(options[2].date).toBe('7 - 8 Oktober 2026');
  });

  it('prioritizes Google Sheet date edits over Supabase DB check-in records for Day 2', () => {
    // Participant checked in on 19 Oct according to DB timestamp
    // but organizer back-dated Day 2 in Google Sheet to 18 Oct
    const options = buildDailyCertificateOptions({
      records: [
        {
          dayNumber: 1,
          checkInAt: '2026-10-17T08:30:00.000Z',
          status: 'completed',
        },
        {
          dayNumber: 2,
          checkInAt: '2026-10-19T10:15:00.000Z', // Original DB timestamp is 19 Oct
          status: 'completed',
        },
      ],
      sheetRowData: {
        'Masa Masuk (Hari 1)': '17/10/2026, 08:30 AM',
        'Masa Masuk (Hari 2)': '18/10/2026, 08:30 AM', // Organizer back-dated to 18 Oct!
        'Masa Keluar (Hari 2)': '18/10/2026, 05:00 PM',
      },
      totalDays: 2,
    });

    expect(options).toHaveLength(3);
    expect(options[0].dayNumber).toBe(1);
    expect(options[0].date).toBe('October 17, 2026');

    // Day 2 MUST reflect the back-dated Google Sheet value (18 Oct), NOT the DB timestamp (19 Oct)
    expect(options[1].dayNumber).toBe(2);
    expect(options[1].label).toBe('Hari 2');
    expect(options[1].date).toBe('October 18, 2026');
    expect(options[1].formattedDate).toBe('October 18, 2026');
  });

  it('prioritizes explicit Tarikh (Hari 2) column over Masa Masuk (Hari 2)', () => {
    const options = buildDailyCertificateOptions({
      records: [
        {
          dayNumber: 2,
          checkInAt: '2026-10-19T10:15:00.000Z',
        },
      ],
      sheetRowData: {
        'Masa Masuk (Hari 2)': '19/10/2026, 08:30 AM',
        'Tarikh (Hari 2)': '18 Oktober 2026', // Explicit column with Malay month
      },
      totalDays: 2,
    });

    expect(options).toHaveLength(1);
    expect(options[0].dayNumber).toBe(2);
    expect(options[0].date).toBe('October 18, 2026');
  });

  it('handles participant who only attended Day 1 in a multi-day event', () => {
    const options = buildDailyCertificateOptions({
      records: [
        {
          dayNumber: 1,
          checkInAt: '2026-10-07T08:38:00.000Z',
          status: 'completed',
        },
      ],
      totalDays: 2,
    });

    expect(options).toHaveLength(1);
    expect(options[0].label).toBe('Hari 1');
    expect(options[0].date).toBe('October 7, 2026');
    expect(options[0].isCombined).toBe(false);
  });
});
