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

const MALAY_MONTH_MAP: Record<string, string> = {
  januari: 'January',
  jan: 'January',
  februari: 'February',
  feb: 'February',
  mac: 'March',
  april: 'April',
  apr: 'April',
  mei: 'May',
  jun: 'June',
  julai: 'July',
  jul: 'July',
  ogos: 'August',
  ogo: 'August',
  september: 'September',
  sep: 'September',
  sept: 'September',
  oktober: 'October',
  okt: 'October',
  november: 'November',
  nov: 'November',
  disember: 'December',
  dis: 'December',
};

/**
 * Format date (e.g. "October 7, 2026") using Malaysia Time (+08:00).
 * Handles Date objects, ISO strings, Malaysian DD/MM/YYYY formats, Malay month names,
 * and preserves multi-day date ranges (e.g. "7 & 8 Oktober 2026").
 */
export function formatAttendanceDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    return dateInput.toLocaleDateString('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const rawStr = String(dateInput).trim();
  if (
    !rawStr ||
    rawStr === '-' ||
    rawStr.toLowerCase() === 'undefined' ||
    rawStr.toLowerCase() === 'null'
  ) {
    return '';
  }

  // If already an ISO string with T (e.g. 2026-10-07T08:38:00.000Z)
  if (rawStr.includes('T')) {
    const isoDate = new Date(rawStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toLocaleDateString('en-US', {
        timeZone: 'Asia/Kuala_Lumpur',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  }

  // Extract date part before any time indicator (e.g. "18/10/2026, 04:15 PM" -> "18/10/2026" or "October 8, 2026, 4:05 PM" -> "October 8, 2026")
  // Do NOT blindly split on commas, because standard formatted dates (e.g. "October 8, 2026") contain a comma before the year.
  const datePart = rawStr.replace(/,?\s*\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?.*$/, '').trim();

  // If it is a multi-day range string containing & or spaced hyphen with multiple dates (e.g. "7 & 8 Oktober 2026", "7 - 8 Oct 2026")
  // preserve it as is.
  if (/\b(?:\d{1,2}\s*(?:&|dan|to|hingga|sampai|\s+-\s+)\s*\d{1,2})\b/i.test(datePart)) {
    return rawStr;
  }

  // Check if DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const dmyMatch = datePart.match(/^(\d{1,2})[/\-.]([01]?\d)[/\-.](\d{2,4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    if (day > 1000) {
      // YYYY/MM/DD format
      const temp = day;
      day = year;
      year = temp;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    }
  }

  // Check if YYYY-MM-DD (e.g. 2026-10-18)
  const ymdMatch = datePart.match(/^(\d{4})[/\-.]([01]?\d)[/\-.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    }
  }

  // Check Malay month names (e.g. "18 Oktober 2026", "18hb Oktober 2026")
  let normalized = datePart.replace(/(\d+)\s*(?:hb|hari\s*bulan)\b/i, '$1');
  const words = normalized.split(/\s+/);
  let replacedAny = false;
  const translatedWords = words.map((w) => {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
    if (MALAY_MONTH_MAP[cleanWord]) {
      replacedAny = true;
      return MALAY_MONTH_MAP[cleanWord];
    }
    return w;
  });

  if (replacedAny) {
    normalized = translatedWords.join(' ');
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  }

  // General fallback parsing (e.g. "October 18, 2026" or other valid Date string)
  const fallbackDate = new Date(datePart);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return rawStr;
}

export interface DailyCertificateOption {
  dayNumber: number; // 1, 2, ... or 0 for All Days / Combined
  label: string; // e.g. "Hari 1", "Hari 2", "Semua Hari (Penuh)"
  date: string; // date string to put on certificate
  formattedDate: string;
  attendedDate?: string;
  isCombined?: boolean;
}

export interface SheetDayMatch {
  dayNumber: number;
  priority: number; // Higher number = higher priority
}

/**
 * Identify if a Google Sheet header represents an attendance or date column for a specific day.
 * Returns the day number and priority weight:
 * - Explicit Date (Tarikh / Date) = 30 (highest priority)
 * - Check-In (Masa Masuk / Check-In) = 20
 * - Check-Out (Masa Keluar / Check-Out) = 10
 * - Generic Day (Hari X / Day X) = 5
 */
export function parseSheetDayColumn(header: string): SheetDayMatch | null {
  const h = header.trim();
  if (!h) return null;

  // Exclude summary/total duration columns
  if (/jumlah\s+jam|jumlah\s+masa|total\s+hours|duration|status\s+kehadiran/i.test(h)) {
    return null;
  }

  let dayNumber: number | null = null;

  // Look for day indicator: e.g. "Hari 2", "Day 2", "(Hari 2)", "Hari-2", "H2", "D2", "Day2"
  const dayMatch =
    h.match(/(?:hari|day)\s*[:#\-]?\s*(\d+)/i) ||
    h.match(/\((?:hari|day)\s*(\d+)\)/i) ||
    h.match(/(?:tarikh|date|masuk|keluar|check[\s-]?in|check[\s-]?out)\s*[:#\-]?\s*(?:hari|day)?\s*(\d+)/i);

  if (dayMatch) {
    dayNumber = parseInt(dayMatch[1], 10);
  } else if (/^(?:hari|day)\s*(\d+)$/i.test(h)) {
    dayNumber = parseInt(h.replace(/\D/g, ''), 10);
  } else {
    // If no explicit day number is present:
    // "Masa Masuk", "Check In", "Masa Keluar", "Check Out" without Day/Hari represents Day 1
    if (/^(?:masa\s+masuk|check[\s-]?in)(?:\s*\(check[\s-]?in\))?$/i.test(h)) {
      dayNumber = 1;
    } else if (/^(?:masa\s+keluar|check[\s-]?out)(?:\s*\(check[\s-]?out\))?$/i.test(h)) {
      dayNumber = 1;
    }
  }

  if (!dayNumber || isNaN(dayNumber) || dayNumber < 1) {
    return null;
  }

  // Priority hierarchy:
  // Explicit Date / Tarikh (30) > Check In / Masa Masuk (20) > Check Out / Masa Keluar (10) > Generic Day (5)
  let priority = 5;
  if (/tarikh|date/i.test(h)) {
    priority = 30;
  } else if (/masuk|check[\s-]?in/i.test(h)) {
    priority = 20;
  } else if (/keluar|check[\s-]?out/i.test(h)) {
    priority = 10;
  }

  return { dayNumber, priority };
}

/**
 * Generate certificate options for multi-day events.
 * Enables participants to claim individual day certificates or a combined full event certificate.
 * Google Sheet date edits take priority over automated Supabase DB check-in timestamps,
 * allowing organizers to backdate or correct attendance dates directly in their spreadsheet.
 */
export function buildDailyCertificateOptions(params: {
  records?: Array<{
    dayNumber?: number;
    checkInAt: string | Date;
    status?: string;
  }>;
  sheetRowData?: Record<string, string | undefined>;
  defaultDate?: string;
  totalDays?: number;
}): DailyCertificateOption[] {
  const { records = [], sheetRowData = {}, defaultDate, totalDays = 1 } = params;
  const optionsMap = new Map<number, DailyCertificateOption>();
  const priorityMap = new Map<number, number>();

  // 1. Process attendance records (from Supabase DB) - baseline priority 0
  if (records && records.length > 0) {
    const sorted = [...records].sort((a, b) => (a.dayNumber ?? 1) - (b.dayNumber ?? 1));
    for (const rec of sorted) {
      const dayNum = rec.dayNumber ?? 1;
      if (!optionsMap.has(dayNum) && rec.checkInAt) {
        const formatted = formatAttendanceDate(rec.checkInAt);
        if (formatted) {
          optionsMap.set(dayNum, {
            dayNumber: dayNum,
            label: `Hari ${dayNum}`,
            date: formatted,
            formattedDate: formatted,
            attendedDate: formatted,
            isCombined: false,
          });
          priorityMap.set(dayNum, 0);
        }
      }
    }
  }

  // 2. Process sheetRowData (Google Sheet columns like "Masa Masuk (Hari 2)", "Tarikh (Hari 2)", etc.)
  // Organizers can edit or back-date values directly in Google Sheets.
  // Google Sheet columns carry higher priority (> 0) than automated DB records,
  // ensuring that backdated or corrected dates in Google Sheets override the automated check-in timestamps.
  if (sheetRowData) {
    for (const [key, val] of Object.entries(sheetRowData)) {
      if (!val || val.trim() === '-' || val.trim() === '') continue;
      const match = parseSheetDayColumn(key);
      if (match) {
        const { dayNumber, priority } = match;
        const currentPriority = priorityMap.get(dayNumber) ?? -1;

        if (priority > currentPriority) {
          const parsed = formatAttendanceDate(val);
          const displayDate = parsed || val.trim();

          optionsMap.set(dayNumber, {
            dayNumber,
            label: `Hari ${dayNumber}`,
            date: displayDate,
            formattedDate: displayDate,
            attendedDate: displayDate,
            isCombined: false,
          });
          priorityMap.set(dayNumber, priority);
        }
      }
    }
  }

  const dailyOptions = Array.from(optionsMap.values()).sort((a, b) => a.dayNumber - b.dayNumber);

  // If there are multiple attended days or totalDays > 1, provide the combined "Semua Hari" option
  if (dailyOptions.length > 1 || (totalDays > 1 && dailyOptions.length > 0)) {
    if (dailyOptions.length > 1) {
      // If defaultDate is an explicit multi-day range text (e.g. "7 & 8 Oktober 2026"), preserve it.
      // If defaultDate is a single-day ISO timestamp or single date, synthesize the range from Day 1 to Day N.
      const isMultiDayText =
        defaultDate &&
        /\b(?:\d{1,2}\s*(?:&|dan|to|hingga|sampai|\s+-\s+)\s*\d{1,2})\b/i.test(defaultDate);

      const combinedDate =
        isMultiDayText
          ? defaultDate.trim()
          : `${dailyOptions[0].date} - ${dailyOptions[dailyOptions.length - 1].date}`;

      const formattedCombined = isMultiDayText
        ? formatAttendanceDate(combinedDate) || combinedDate
        : combinedDate;

      dailyOptions.push({
        dayNumber: 0,
        label: 'Semua Hari (Penuh)',
        date: combinedDate,
        formattedDate: formattedCombined,
        isCombined: true,
      });
    }
  }

  return dailyOptions;
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
