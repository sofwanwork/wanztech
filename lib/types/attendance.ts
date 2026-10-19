export type AttendanceStatus = 'checked_in' | 'completed';

export interface AttendanceRecord {
  id: string;
  formId: string;
  userId: string;
  submissionId: string;
  identifierValue: string;
  identifierLabel: string;
  participantName?: string;
  checkInAt: string;
  checkOutAt?: string | null;
  durationMinutes?: number | null;
  status: AttendanceStatus;
  dayNumber?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyAttendanceDetail {
  dayNumber: number;
  checkInTime: string;
  checkOutTime?: string;
  durationFormatted?: string;
  durationHours?: number;
  status: AttendanceStatus;
}

export interface AttendanceSummary {
  status: AttendanceStatus | 'not_checked_in';
  participantName?: string;
  identifierValue?: string;
  checkInTime?: string;
  checkOutTime?: string;
  durationFormatted?: string;
  durationHours?: number;
  canCheckOut?: boolean;
  minDurationRemainingMinutes?: number;
  checkInAtIso?: string;
  minHoursForCertificate?: number;
  isEarlyCheckOut?: boolean;
  earlyCheckOutShortfallText?: string;
  // Multi-day fields
  dayNumber?: number;
  totalDays?: number;
  completedDays?: number;
  isAllDaysCompleted?: boolean;
  totalAccumulatedMinutes?: number;
  totalAccumulatedHours?: number;
  totalAccumulatedFormatted?: string;
  dailyRecords?: DailyAttendanceDetail[];
  canCheckInNextDay?: boolean;
  nextDayNumber?: number;
}

export interface AttendanceStats {
  total: number;
  checkedIn: number;
  completed: number;
}

export interface DailyCertificateOption {
  dayNumber: number;
  label: string;
  date: string;
  formattedDate: string;
  attendedDate?: string;
  isCombined?: boolean;
}
