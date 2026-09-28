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

  let formattedText = '0 Minit';
  if (hours > 0 && minutes > 0) {
    formattedText = `${hours} Jam ${minutes} Minit`;
  } else if (hours > 0) {
    formattedText = `${hours} Jam`;
  } else if (minutes > 0) {
    formattedText = `${minutes} Minit`;
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
