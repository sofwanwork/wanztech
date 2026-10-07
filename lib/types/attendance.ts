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
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
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
}

export interface AttendanceStats {
  total: number;
  checkedIn: number;
  completed: number;
}
