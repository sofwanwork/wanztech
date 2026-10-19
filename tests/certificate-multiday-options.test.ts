import { describe, it, expect } from 'vitest';
import { buildDailyCertificateOptions, formatAttendanceDate } from '@/lib/forms/attendance';

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

  it('returns raw string when not parseable (e.g. multi-day text)', () => {
    const formatted = formatAttendanceDate('7 & 8 Oktober 2026');
    expect(formatted).toBe('7 & 8 Oktober 2026');
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
