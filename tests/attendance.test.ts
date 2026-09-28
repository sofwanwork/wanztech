import { describe, it, expect } from 'vitest';
import {
  cleanIdentifier,
  calculateAttendanceDuration,
  canPerformCheckOut,
  findIdentifierField,
  findNameField,
  formatAttendanceTime,
  formatAttendanceDateTime,
} from '@/lib/forms/attendance';
import { FormField } from '@/lib/types';

describe('Attendance Helpers — cleanIdentifier', () => {
  it('strips dashes, spaces, and handles case for IC numbers', () => {
    expect(cleanIdentifier('980101-14-5555')).toBe('980101145555');
    expect(cleanIdentifier(' 980101 - 14 - 5555 ')).toBe('980101145555');
    expect(cleanIdentifier('A-12345')).toBe('a12345');
  });

  it('lowercases and trims email addresses', () => {
    expect(cleanIdentifier(' User@Domain.COM ')).toBe('user@domain.com');
  });

  it('handles null, undefined, and non-string safely', () => {
    expect(cleanIdentifier(null)).toBe('');
    expect(cleanIdentifier(undefined)).toBe('');
    expect(cleanIdentifier(12345)).toBe('12345');
  });
});

describe('Attendance Helpers — calculateAttendanceDuration', () => {
  it('correctly calculates hours and minutes', () => {
    const start = '2026-09-28T08:30:00.000Z';
    const end = '2026-09-28T16:30:00.000Z'; // 8 hours exact
    const result = calculateAttendanceDuration(start, end);

    expect(result.totalMinutes).toBe(480);
    expect(result.hours).toBe(8);
    expect(result.minutes).toBe(0);
    expect(result.decimalHours).toBe(8.0);
    expect(result.formattedText).toBe('8 Jam');
  });

  it('handles combined hours and minutes', () => {
    const start = '2026-09-28T08:30:00.000Z';
    const end = '2026-09-28T16:45:00.000Z'; // 8 hours 15 mins
    const result = calculateAttendanceDuration(start, end);

    expect(result.totalMinutes).toBe(495);
    expect(result.hours).toBe(8);
    expect(result.minutes).toBe(15);
    expect(result.decimalHours).toBe(8.25);
    expect(result.formattedText).toBe('8 Jam 15 Minit');
  });

  it('deducts break minutes properly', () => {
    const start = '2026-09-28T08:30:00.000Z';
    const end = '2026-09-28T16:30:00.000Z'; // 8 hours
    const result = calculateAttendanceDuration(start, end, 60); // 1 hour lunch

    expect(result.totalMinutes).toBe(420);
    expect(result.hours).toBe(7);
    expect(result.minutes).toBe(0);
    expect(result.decimalHours).toBe(7.0);
    expect(result.formattedText).toBe('7 Jam');
  });

  it('guards against negative duration if end is before start', () => {
    const start = '2026-09-28T16:30:00.000Z';
    const end = '2026-09-28T08:30:00.000Z';
    const result = calculateAttendanceDuration(start, end);

    expect(result.totalMinutes).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.formattedText).toBe('0 Minit');
  });
});

describe('Attendance Helpers — canPerformCheckOut', () => {
  it('permits check-out when elapsed time exceeds minDurationMinutes', () => {
    const checkIn = '2026-09-28T08:00:00.000Z';
    const now = '2026-09-28T08:10:00.000Z'; // 10 mins elapsed
    const check = canPerformCheckOut(checkIn, now, 5);

    expect(check.canCheckOut).toBe(true);
    expect(check.remainingMinutes).toBe(0);
  });

  it('blocks check-out and gives remaining minutes when too soon', () => {
    const checkIn = '2026-09-28T08:00:00.000Z';
    const now = '2026-09-28T08:02:00.000Z'; // only 2 mins elapsed
    const check = canPerformCheckOut(checkIn, now, 5);

    expect(check.canCheckOut).toBe(false);
    expect(check.remainingMinutes).toBe(3);
  });
});

describe('Attendance Helpers — findIdentifierField & findNameField', () => {
  const fields: FormField[] = [
    { id: 'f1', type: 'text', label: 'Nama Penuh', required: true },
    { id: 'f2', type: 'text', label: 'No. Kad Pengenalan', required: true },
    { id: 'f3', type: 'email', label: 'Alamat Emel', required: false },
  ];

  it('finds identifier by configured id', () => {
    expect(findIdentifierField(fields, 'f3')?.id).toBe('f3');
  });

  it('auto-detects IC field by regex label', () => {
    expect(findIdentifierField(fields)?.id).toBe('f2');
  });

  it('auto-detects Name field by regex label', () => {
    expect(findNameField(fields)?.id).toBe('f1');
  });
});

describe('Attendance Helpers — formatting', () => {
  it('formats time to 12-hour Malaysia time', () => {
    // 00:30 UTC is 08:30 in Asia/Kuala_Lumpur (+08:00)
    const d = '2026-09-28T00:30:00.000Z';
    const formatted = formatAttendanceTime(d);
    expect(formatted).toMatch(/08:30\s*(AM|am)/i);
  });

  it('formats date and time in Malaysia format', () => {
    const d = '2026-09-28T00:30:00.000Z';
    const formatted = formatAttendanceDateTime(d);
    expect(formatted).toContain('28/09/2026');
    expect(formatted).toMatch(/08:30\s*(AM|am)/i);
  });
});
