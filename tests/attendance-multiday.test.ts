import { describe, it, expect } from 'vitest';
import {
  calculateMultiDayAttendanceDuration,
  checkCertificateAttendanceEligibility,
} from '@/lib/forms/attendance';
import { AttendanceRecord } from '@/lib/types';

describe('Multi-Day Attendance Helpers — calculateMultiDayAttendanceDuration', () => {
  it('returns zero duration when given an empty records array', () => {
    const result = calculateMultiDayAttendanceDuration([]);
    expect(result.totalMinutes).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.decimalHours).toBe(0);
    expect(result.formattedText).toBe('0 Minutes');
    expect(result.dailyBreakdown).toEqual([]);
  });

  it('correctly calculates duration for a single day record in multi-day array', () => {
    const records: Partial<AttendanceRecord>[] = [
      {
        dayNumber: 1,
        checkInAt: '2026-10-18T08:30:00.000Z',
        checkOutAt: '2026-10-18T16:30:00.000Z', // 8 hours
        status: 'completed',
      },
    ];

    const result = calculateMultiDayAttendanceDuration(records as AttendanceRecord[]);
    expect(result.totalMinutes).toBe(480);
    expect(result.hours).toBe(8);
    expect(result.minutes).toBe(0);
    expect(result.decimalHours).toBe(8.0);
    expect(result.formattedText).toBe('8 Hours');
    expect(result.dailyBreakdown).toHaveLength(1);
    expect(result.dailyBreakdown[0].dayNumber).toBe(1);
    expect(result.dailyBreakdown[0].hours).toBe(8);
  });

  it('accumulates hours across multiple days (Day 1 + Day 2)', () => {
    const records: Partial<AttendanceRecord>[] = [
      {
        dayNumber: 1,
        checkInAt: '2026-10-18T08:00:00.000Z',
        checkOutAt: '2026-10-18T12:30:00.000Z', // 4 hours 30 mins (270 mins)
        status: 'completed',
      },
      {
        dayNumber: 2,
        checkInAt: '2026-10-19T08:00:00.000Z',
        checkOutAt: '2026-10-19T11:45:00.000Z', // 3 hours 45 mins (225 mins)
        status: 'completed',
      },
    ];

    // Total: 270 + 225 = 495 mins = 8 hours 15 mins
    const result = calculateMultiDayAttendanceDuration(records as AttendanceRecord[]);
    expect(result.totalMinutes).toBe(495);
    expect(result.hours).toBe(8);
    expect(result.minutes).toBe(15);
    expect(result.decimalHours).toBe(8.25);
    expect(result.formattedText).toBe('8 Hours 15 Minutes');
    expect(result.dailyBreakdown).toHaveLength(2);
    expect(result.dailyBreakdown[0].dayNumber).toBe(1);
    expect(result.dailyBreakdown[0].minutes).toBe(270);
    expect(result.dailyBreakdown[1].dayNumber).toBe(2);
    expect(result.dailyBreakdown[1].minutes).toBe(225);
  });

  it('deducts daily break minutes per day', () => {
    const records: Partial<AttendanceRecord>[] = [
      {
        dayNumber: 1,
        checkInAt: '2026-10-18T08:00:00.000Z',
        checkOutAt: '2026-10-18T16:00:00.000Z', // 8 hours (480 mins)
        status: 'completed',
      },
      {
        dayNumber: 2,
        checkInAt: '2026-10-19T08:00:00.000Z',
        checkOutAt: '2026-10-19T16:00:00.000Z', // 8 hours (480 mins)
        status: 'completed',
      },
    ];

    // 60 minutes lunch break per day -> (480-60) + (480-60) = 420 + 420 = 840 mins = 14 hours
    const result = calculateMultiDayAttendanceDuration(records as AttendanceRecord[], 60);
    expect(result.totalMinutes).toBe(840);
    expect(result.hours).toBe(14);
    expect(result.minutes).toBe(0);
    expect(result.decimalHours).toBe(14.0);
    expect(result.formattedText).toBe('14 Hours');
    expect(result.dailyBreakdown[0].minutes).toBe(420);
    expect(result.dailyBreakdown[1].minutes).toBe(420);
  });

  it('ignores incomplete (checked_in) days when calculating completed duration', () => {
    const records: Partial<AttendanceRecord>[] = [
      {
        dayNumber: 1,
        checkInAt: '2026-10-18T08:00:00.000Z',
        checkOutAt: '2026-10-18T12:00:00.000Z', // 4 hours
        status: 'completed',
      },
      {
        dayNumber: 2,
        checkInAt: '2026-10-19T08:00:00.000Z',
        checkOutAt: null,
        status: 'checked_in',
      },
    ];

    const result = calculateMultiDayAttendanceDuration(records as AttendanceRecord[]);
    expect(result.totalMinutes).toBe(240);
    expect(result.hours).toBe(4);
    expect(result.completedDays).toBe(1);
    expect(result.dailyBreakdown).toHaveLength(2);
    expect(result.dailyBreakdown[0].dayNumber).toBe(1);
    expect(result.dailyBreakdown[0].status).toBe('completed');
    expect(result.dailyBreakdown[1].dayNumber).toBe(2);
    expect(result.dailyBreakdown[1].status).toBe('checked_in');
  });
});

describe('Multi-Day Attendance — checkCertificateAttendanceEligibility', () => {
  it('allows certificate claim when minHoursRequired is 0 or unconfigured', () => {
    const records: Partial<AttendanceRecord>[] = [];
    const res = checkCertificateAttendanceEligibility(records as AttendanceRecord[], 0);
    expect(res.eligible).toBe(true);
    expect(res.requiredHours).toBe(0);
  });

  it('rejects claiming certificate if participant has no attendance records at all', () => {
    const res = checkCertificateAttendanceEligibility([], 6);
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe('no_record');
    expect(res.requiredHours).toBe(6);
    expect(res.message).toContain('No check-in record');
  });

  it('rejects claiming certificate if any day record is still checked_in', () => {
    const records: Partial<AttendanceRecord>[] = [
      {
        dayNumber: 1,
        status: 'completed',
        checkInAt: '2026-10-18T08:00:00.000Z',
        checkOutAt: '2026-10-18T16:00:00.000Z',
      },
      {
        dayNumber: 2,
        status: 'checked_in',
        checkInAt: '2026-10-19T08:00:00.000Z',
        checkOutAt: null,
      },
    ];

    const res = checkCertificateAttendanceEligibility(records as AttendanceRecord[], 10);
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe('not_checked_out');
    expect(res.message).toContain('have not checked out');
  });

  it('rejects claiming certificate if cumulative multi-day hours are insufficient', () => {
    const records: Partial<AttendanceRecord>[] = [
      {
        dayNumber: 1,
        status: 'completed',
        checkInAt: '2026-10-18T08:00:00.000Z',
        checkOutAt: '2026-10-18T11:00:00.000Z', // 3 hours
      },
      {
        dayNumber: 2,
        status: 'completed',
        checkInAt: '2026-10-19T08:00:00.000Z',
        checkOutAt: '2026-10-19T10:00:00.000Z', // 2 hours
      },
    ];

    // Total attended: 5 hours. Required: 8 hours. Shortfall: 3 hours
    const res = checkCertificateAttendanceEligibility(records as AttendanceRecord[], 8);
    expect(res.eligible).toBe(false);
    expect(res.reason).toBe('insufficient_hours');
    expect(res.attendedHours).toBe(5);
    expect(res.requiredHours).toBe(8);
    expect(res.shortfallMinutes).toBe(180);
    expect(res.shortfallText).toBe('3 Hours');
    expect(res.message).toContain('short by 3 Hours');
  });

  it('permits claiming certificate when multi-day cumulative hours satisfy requirement', () => {
    const records: Partial<AttendanceRecord>[] = [
      {
        dayNumber: 1,
        status: 'completed',
        checkInAt: '2026-10-18T08:00:00.000Z',
        checkOutAt: '2026-10-18T13:00:00.000Z', // 5 hours
      },
      {
        dayNumber: 2,
        status: 'completed',
        checkInAt: '2026-10-19T08:00:00.000Z',
        checkOutAt: '2026-10-19T13:00:00.000Z', // 5 hours
      },
    ];

    // Total attended: 10 hours. Required: 8 hours.
    const res = checkCertificateAttendanceEligibility(records as AttendanceRecord[], 8);
    expect(res.eligible).toBe(true);
    expect(res.attendedHours).toBe(10);
    expect(res.requiredHours).toBe(8);
    expect(res.shortfallMinutes).toBe(0);
    expect(res.message).toContain('Congratulations');
  });

  it('backward compatibility: supports single attendance record object', () => {
    const singleRecord: Partial<AttendanceRecord> = {
      dayNumber: 1,
      status: 'completed',
      checkInAt: '2026-10-18T08:00:00.000Z',
      checkOutAt: '2026-10-18T16:00:00.000Z', // 8 hours
    };

    const res = checkCertificateAttendanceEligibility(singleRecord as AttendanceRecord, 6);
    expect(res.eligible).toBe(true);
    expect(res.attendedHours).toBe(8);
  });
});
