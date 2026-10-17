import { FormField } from '@/lib/types';

/**
 * Standardize and clean identifier input (IC number, email, phone, etc.)
 * Strips common punctuation, spaces, dashes for ICs, and lowercases emails.
 */
export function cleanIdentifier(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  // If it looks like an email, lowercase and trim
  if (str.includes('@')) {
    return str.toLowerCase();
  }
  // For IC / Phone / alphanumeric IDs, remove spaces, dashes, slashes
  return str.replace(/[\s\-_/]/g, '').toLowerCase();
}

/**
 * Find the form field designated as the participant identifier.
 * Priority:
 * 1. Field matching configured identifierFieldId
 * 2. Field with IC / Kad Pengenalan / NRIC in label
 * 3. Field of type 'email' or with Email in label
 */
export function findIdentifierField(
  fields: FormField[],
  configuredFieldId?: string
): FormField | undefined {
  if (!fields || fields.length === 0) return undefined;

  if (configuredFieldId) {
    const matched = fields.find((f) => f.id === configuredFieldId);
    if (matched) return matched;
  }

  // Regex pattern for Malaysian IC / NRIC
  const icRegex = /\b(ic|kp|kad\s*pengenalan|no\.?\s*ic|no\.?\s*kp|nric|passport|pasport|no\s*matrik|id\s*staf)\b/i;
  const icField = fields.find((f) => icRegex.test(f.label));
  if (icField) return icField;

  // Fallback to email
  const emailField = fields.find(
    (f) => f.type === 'email' || /\b(email|emel)\b/i.test(f.label)
  );
  if (emailField) return emailField;

  return undefined;
}

/**
 * Find the field for the participant's name.
 */
export function findNameField(fields: FormField[]): FormField | undefined {
  if (!fields || fields.length === 0) return undefined;
  const nameRegex = /\b(nama|name|full\s*name|nama\s*penuh|peserta)\b/i;
  return fields.find((f) => nameRegex.test(f.label));
}

export interface DurationResult {
  totalMinutes: number;
  hours: number;
  minutes: number;
  decimalHours: number;
  formattedText: string;
}

/**
 * Calculate attendance duration between check-in and check-out.
 */
export function calculateAttendanceDuration(
  checkInAt: string | Date,
  checkOutAt: string | Date,
  breakMinutes = 0
): DurationResult {
  const start = new Date(checkInAt).getTime();
  const end = new Date(checkOutAt).getTime();

  let diffMinutes = 0;
  if (!isNaN(start) && !isNaN(end) && end > start) {
    diffMinutes = Math.floor((end - start) / 60000);
  }

  const safeBreak = Math.max(0, Number(breakMinutes) || 0);
  const netMinutes = Math.max(0, diffMinutes - safeBreak);

  const hours = Math.floor(netMinutes / 60);
  const minutes = netMinutes % 60;
  const decimalHours = Math.round((netMinutes / 60) * 100) / 100;

  let formattedText = '0 Minutes';
  if (hours > 0 && minutes > 0) {
    formattedText = `${hours} Hours ${minutes} Minutes`;
  } else if (hours > 0) {
    formattedText = `${hours} Hours`;
  } else if (minutes > 0) {
    formattedText = `${minutes} Minutes`;
  }

  return {
    totalMinutes: netMinutes,
    hours,
    minutes,
    decimalHours,
    formattedText,
  };
}

/**
 * Check if the minimum duration has elapsed before allowing check-out.
 */
export function canPerformCheckOut(
  checkInAt: string | Date,
  nowTime: string | Date,
  minDurationMinutes = 5
): { canCheckOut: boolean; remainingMinutes: number } {
  const start = new Date(checkInAt).getTime();
  const now = new Date(nowTime).getTime();

  if (isNaN(start) || isNaN(now)) {
    return { canCheckOut: true, remainingMinutes: 0 };
  }

  const minMinutes = Math.max(0, Number(minDurationMinutes) || 0);
  const elapsedMinutes = Math.floor((now - start) / 60000);

  if (elapsedMinutes >= minMinutes) {
    return { canCheckOut: true, remainingMinutes: 0 };
  }

  return {
    canCheckOut: false,
    remainingMinutes: Math.max(1, minMinutes - elapsedMinutes),
  };
}

/**
 * Format time in 12-hour format (e.g. "08:30 AM") using Malaysia Time (+08:00)
 */
export function formatAttendanceTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format full date and time (e.g. "28/09/2026, 08:30 AM")
 */
export function formatAttendanceDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const dateStr = date.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timeStr = formatAttendanceTime(date);
  return `${dateStr}, ${timeStr}`;
}

export interface MultiDayDurationResult {
  totalMinutes: number;
  hours: number;
  minutes: number;
  decimalHours: number;
  totalDecimalHours: number;
  formattedText: string;
  formattedTotalText: string;
  completedDays: number;
  dailyBreakdown: Array<{
    dayNumber: number;
    hours: number;
    minutes: number;
    decimalHours: number;
    formattedText: string;
    duration: DurationResult;
    checkInAt: string;
    checkOutAt?: string | null;
    status: string;
  }>;
}

/**
 * Calculate cumulative duration across multiple days / attendance records.
 */
export function calculateMultiDayAttendanceDuration(
  records: Array<{
    dayNumber?: number;
    checkInAt: string | Date;
    checkOutAt?: string | Date | null;
    status: string;
    durationMinutes?: number | null;
  }>,
  breakMinutesPerDay = 0
): MultiDayDurationResult {
  if (!records || records.length === 0) {
    return {
      totalMinutes: 0,
      hours: 0,
      minutes: 0,
      decimalHours: 0,
      totalDecimalHours: 0,
      formattedText: '0 Minutes',
      formattedTotalText: '0 Minutes',
      completedDays: 0,
      dailyBreakdown: [],
    };
  }

  let totalMinutes = 0;
  let completedDays = 0;

  const dailyBreakdown = records.map((rec, index) => {
    const dayNum = rec.dayNumber ?? index + 1;
    if (rec.status === 'completed' && rec.checkOutAt) {
      const dur = calculateAttendanceDuration(rec.checkInAt, rec.checkOutAt, breakMinutesPerDay);
      totalMinutes += dur.totalMinutes;
      completedDays++;
      return {
        dayNumber: dayNum,
        hours: dur.hours,
        minutes: dur.totalMinutes,
        decimalHours: dur.decimalHours,
        formattedText: dur.formattedText,
        duration: dur,
        checkInAt: String(rec.checkInAt),
        checkOutAt: String(rec.checkOutAt),
        status: rec.status,
      };
    } else {
      const dur = calculateAttendanceDuration(rec.checkInAt, new Date(), breakMinutesPerDay);
      return {
        dayNumber: dayNum,
        hours: dur.hours,
        minutes: dur.totalMinutes,
        decimalHours: dur.decimalHours,
        formattedText: dur.formattedText,
        duration: dur,
        checkInAt: String(rec.checkInAt),
        checkOutAt: null,
        status: rec.status,
      };
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalDecimalHours = Math.round((totalMinutes / 60) * 100) / 100;

  let formattedTotalText = '0 Minutes';
  if (hours > 0 && minutes > 0) {
    formattedTotalText = `${hours} Hours ${minutes} Minutes`;
  } else if (hours > 0) {
    formattedTotalText = `${hours} Hours`;
  } else if (minutes > 0) {
    formattedTotalText = `${minutes} Minutes`;
  }

  return {
    totalMinutes,
    hours,
    minutes,
    decimalHours: totalDecimalHours,
    totalDecimalHours,
    formattedText: formattedTotalText,
    formattedTotalText,
    completedDays,
    dailyBreakdown,
  };
}

export interface CertificateAttendanceEligibility {
  eligible: boolean;
  reason?: 'no_record' | 'not_checked_out' | 'insufficient_hours';
  attendedHours: number;
  attendedDurationFormatted: string;
  requiredHours: number;
  shortfallMinutes: number;
  shortfallText: string;
  message: string;
}

export type AttendanceRecordInput = {
  status: string;
  checkInAt: string | Date;
  checkOutAt?: string | Date | null;
  durationMinutes?: number | null;
  dayNumber?: number;
};

/**
 * Check if a participant's attendance record(s) qualify them for certificate claiming.
 * Supports both a single attendance record or an array of multi-day records.
 */
export function checkCertificateAttendanceEligibility(
  recordOrRecords:
    | AttendanceRecordInput
    | AttendanceRecordInput[]
    | null
    | undefined,
  minHoursRequired: number,
  breakMinutes = 0
): CertificateAttendanceEligibility {
  const reqHours = Math.max(0, Number(minHoursRequired) || 0);

  // If no requirement or <= 0, automatically eligible
  if (reqHours <= 0) {
    return {
      eligible: true,
      attendedHours: 0,
      attendedDurationFormatted: '0 Hours',
      requiredHours: 0,
      shortfallMinutes: 0,
      shortfallText: '',
      message: 'Eligible for certificate.',
    };
  }

  const records: AttendanceRecordInput[] = !recordOrRecords
    ? []
    : Array.isArray(recordOrRecords)
      ? recordOrRecords
      : [recordOrRecords];

  if (records.length === 0) {
    return {
      eligible: false,
      reason: 'no_record',
      attendedHours: 0,
      attendedDurationFormatted: '0 Hours',
      requiredHours: reqHours,
      shortfallMinutes: Math.round(reqHours * 60),
      shortfallText: `${reqHours} Hours`,
      message: 'No check-in record found for this program.',
    };
  }

  // Check if any record is currently checked_in (not yet checked out)
  const activeCheckIn = records.find((r) => r.status === 'checked_in' || !r.checkOutAt);
  const completedRecords = records.filter((r) => r.status === 'completed' && r.checkOutAt);

  // If there is an active check-in (participant has not checked out)
  if (activeCheckIn) {
    const elapsed = calculateAttendanceDuration(activeCheckIn.checkInAt, new Date(), breakMinutes);
    const dayNotice = activeCheckIn.dayNumber ? ` for Day ${activeCheckIn.dayNumber}` : '';
    return {
      eligible: false,
      reason: 'not_checked_out',
      attendedHours: elapsed.decimalHours,
      attendedDurationFormatted: elapsed.formattedText,
      requiredHours: reqHours,
      shortfallMinutes: Math.max(0, Math.round(reqHours * 60 - elapsed.totalMinutes)),
      shortfallText: '',
      message:
        `You have not checked out yet${dayNotice}. Please scan the program QR code to check out and record your total attendance hours.`,
    };
  }

  // Calculate total hours across completed records
  const multiDay = calculateMultiDayAttendanceDuration(completedRecords, breakMinutes);
  const requiredMinutes = Math.round(reqHours * 60);

  if (multiDay.totalMinutes < requiredMinutes) {
    const shortfallMin = requiredMinutes - multiDay.totalMinutes;
    const shortH = Math.floor(shortfallMin / 60);
    const shortM = shortfallMin % 60;
    let shortfallText = '';
    if (shortH > 0 && shortM > 0) shortfallText = `${shortH} Hours ${shortM} Minutes`;
    else if (shortH > 0) shortfallText = `${shortH} Hours`;
    else shortfallText = `${shortM} Minutes`;

    return {
      eligible: false,
      reason: 'insufficient_hours',
      attendedHours: multiDay.totalDecimalHours,
      attendedDurationFormatted: multiDay.formattedTotalText,
      requiredHours: reqHours,
      shortfallMinutes: shortfallMin,
      shortfallText,
      message: `Your total attendance is ${multiDay.formattedTotalText} (minimum requirement: ${reqHours} Hours). You are short by ${shortfallText} to be eligible for certificate claiming.`,
    };
  }

  return {
    eligible: true,
    attendedHours: multiDay.totalDecimalHours,
    attendedDurationFormatted: multiDay.formattedTotalText,
    requiredHours: reqHours,
    shortfallMinutes: 0,
    shortfallText: '',
    message: 'Congratulations! You have fulfilled the required attendance hours and are eligible to claim your certificate.',
  };
}

/**
 * Check if the current check-out attempt is before fulfilling minimum certificate hours.
 */
export function isEarlyCheckOut(
  checkInAt: string | Date,
  nowTime: string | Date,
  minHoursRequired: number,
  breakMinutes = 0
): {
  isEarly: boolean;
  attendedDurationText: string;
  attendedMinutes: number;
  requiredHours: number;
  shortfallText: string;
} {
  const reqHours = Math.max(0, Number(minHoursRequired) || 0);
  if (reqHours <= 0) {
    return {
      isEarly: false,
      attendedDurationText: '',
      attendedMinutes: 0,
      requiredHours: 0,
      shortfallText: '',
    };
  }

  const dur = calculateAttendanceDuration(checkInAt, nowTime, breakMinutes);
  const requiredMinutes = Math.round(reqHours * 60);

  if (dur.totalMinutes < requiredMinutes) {
    const diff = requiredMinutes - dur.totalMinutes;
    const shortH = Math.floor(diff / 60);
    const shortM = diff % 60;
    let shortfallText = '';
    if (shortH > 0 && shortM > 0) shortfallText = `${shortH} Hours ${shortM} Minutes`;
    else if (shortH > 0) shortfallText = `${shortH} Hours`;
    else shortfallText = `${shortM} Minutes`;

    return {
      isEarly: true,
      attendedDurationText: dur.formattedText,
      attendedMinutes: dur.totalMinutes,
      requiredHours: reqHours,
      shortfallText,
    };
  }

  return {
    isEarly: false,
    attendedDurationText: dur.formattedText,
    attendedMinutes: dur.totalMinutes,
    requiredHours: reqHours,
    shortfallText: '',
  };
}
