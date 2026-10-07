'use server';

import { headers as getNextHeaders } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getFormById } from '@/lib/storage/forms';
import { getSettingsByFormId } from '@/lib/storage/settings';
import {
  getAttendanceRecord,
  updateAttendanceCheckOut,
  getAttendanceStatsForForm,
  clearAttendanceRecordsForForm,
} from '@/lib/storage/attendance';
import {
  cleanIdentifier,
  calculateAttendanceDuration,
  canPerformCheckOut,
  formatAttendanceTime,
  formatAttendanceDateTime,
  isEarlyCheckOut,
} from '@/lib/forms/attendance';
import { updateSheetRow } from '@/lib/api/google-sheets';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { AttendanceSummary, AttendanceStats } from '@/lib/types';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import {
  generateRotatingQrPayload,
  verifyRotatingQrToken,
  RotatingQrPayload,
  DEFAULT_ROTATING_INTERVAL_SECONDS,
} from '@/lib/forms/rotating-qr';

function formatPrivateKey(key: string) {
  let clean = key.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
  if (clean.includes('\\n')) clean = clean.replace(/\\n/g, '\n');
  return clean;
}

/**
 * Server action to inspect a participant's attendance status for a form.
 */
export async function checkAttendanceStatusAction(
  formId: string,
  rawIdentifier: string
): Promise<{
  ok: boolean;
  summary?: AttendanceSummary;
  error?: string;
}> {
  if (!formId || !rawIdentifier) {
    return { ok: false, error: 'Form and identifier are required.' };
  }

  // Rate limit
  const headersList = await getNextHeaders();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(ip, RATE_LIMITS.formSubmission, 'attendance-check');
  if (!rl.success) {
    return { ok: false, error: 'Too many attempts. Please try again in a moment.' };
  }

  const cleanId = cleanIdentifier(rawIdentifier);
  if (!cleanId) {
    return { ok: false, error: 'Invalid identifier.' };
  }

  const form = await getFormById(formId);
  if (!form) {
    return { ok: false, error: 'Form not found.' };
  }

  const checkInOutConfig = form.attendanceSettings?.checkInOut;
  if (!form.attendanceSettings?.enabled || !checkInOutConfig?.enabled) {
    return { ok: false, error: 'Smart attendance mode is not enabled on this form.' };
  }

  const record = await getAttendanceRecord(formId, cleanId);
  if (!record) {
    return {
      ok: true,
      summary: {
        status: 'not_checked_in',
        identifierValue: rawIdentifier,
      },
    };
  }

  const breakMinutes = checkInOutConfig.breakMinutes || 0;
  const minDuration = checkInOutConfig.minDurationMinutes ?? 5;

  if (record.status === 'checked_in') {
    const check = canPerformCheckOut(record.checkInAt, new Date(), minDuration);
    const minHoursForCert = checkInOutConfig.minHoursForCertificate;
    const earlyCheck = minHoursForCert
      ? isEarlyCheckOut(record.checkInAt, new Date(), minHoursForCert, breakMinutes)
      : undefined;

    return {
      ok: true,
      summary: {
        status: 'checked_in',
        participantName: record.participantName,
        identifierValue: rawIdentifier,
        checkInTime: formatAttendanceTime(record.checkInAt),
        canCheckOut: check.canCheckOut,
        minDurationRemainingMinutes: check.remainingMinutes,
        checkInAtIso: record.checkInAt,
        minHoursForCertificate: minHoursForCert,
        isEarlyCheckOut: earlyCheck?.isEarly,
        earlyCheckOutShortfallText: earlyCheck?.shortfallText,
      },
    };
  }

  // Already completed (checked-out)
  const duration = calculateAttendanceDuration(
    record.checkInAt,
    record.checkOutAt || record.checkInAt,
    breakMinutes
  );

  return {
    ok: true,
    summary: {
      status: 'completed',
      participantName: record.participantName,
      identifierValue: rawIdentifier,
      checkInTime: formatAttendanceTime(record.checkInAt),
      checkOutTime: record.checkOutAt ? formatAttendanceTime(record.checkOutAt) : '',
      durationFormatted: duration.formattedText,
      durationHours: duration.decimalHours,
      canCheckOut: false,
    },
  };
}

/**
 * Server action to perform Check-Out for a participant.
 */
export async function submitAttendanceCheckOutAction(
  formId: string,
  rawIdentifier: string,
  passcode?: string,
  rotatingQrParams?: { windowIndex?: number | string | null; signature?: string | null }
): Promise<{
  success: boolean;
  summary?: AttendanceSummary;
  error?: string;
}> {
  if (!formId || !rawIdentifier) {
    return { success: false, error: 'Form and identifier are required.' };
  }

  // Rate limit
  const headersList = await getNextHeaders();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(ip, RATE_LIMITS.formSubmission, 'attendance-checkout');
  if (!rl.success) {
    return { success: false, error: 'Too many attempts. Please try again in a moment.' };
  }

  const cleanId = cleanIdentifier(rawIdentifier);
  const form = await getFormById(formId);
  if (!form) {
    return { success: false, error: 'Form not found.' };
  }

  const checkInOutConfig = form.attendanceSettings?.checkInOut;
  if (!form.attendanceSettings?.enabled || !checkInOutConfig?.enabled) {
    return { success: false, error: 'Smart attendance mode is not active.' };
  }

  // Passcode verification (Solution 2)
  if (checkInOutConfig.checkOutPasscode && checkInOutConfig.checkOutPasscode.trim()) {
    const expected = checkInOutConfig.checkOutPasscode.trim();
    const actual = (passcode || '').trim();
    if (!actual || actual !== expected) {
      return {
        success: false,
        error: 'Invalid Check-Out PIN. Please enter the correct PIN from the speaker/organizer.',
      };
    }
  }

  // Rotating QR verification (Solution 3)
  const rotatingQrConfig = form.attendanceSettings?.rotatingQr;
  if (rotatingQrConfig?.enabled) {
    const verify = verifyRotatingQrToken({
      formId: form.id,
      windowIndex: rotatingQrParams?.windowIndex,
      signature: rotatingQrParams?.signature,
      customSecret: rotatingQrConfig.secret,
      intervalSeconds: rotatingQrConfig.intervalSeconds,
    });

    if (!verify.valid) {
      return {
        success: false,
        error:
          'This QR code has expired or is invalid. Please scan the live QR code currently displayed on the event screen.',
      };
    }
  }

  const record = await getAttendanceRecord(formId, cleanId);
  if (!record) {
    return { success: false, error: 'Check-in record not found.' };
  }

  if (record.status === 'completed') {
    const dur = calculateAttendanceDuration(
      record.checkInAt,
      record.checkOutAt || record.checkInAt,
      checkInOutConfig.breakMinutes || 0
    );
    return {
      success: true,
      summary: {
        status: 'completed',
        participantName: record.participantName,
        checkInTime: formatAttendanceTime(record.checkInAt),
        checkOutTime: record.checkOutAt ? formatAttendanceTime(record.checkOutAt) : '',
        durationFormatted: dur.formattedText,
        durationHours: dur.decimalHours,
      },
    };
  }

  const now = new Date();
  const minDuration = checkInOutConfig.minDurationMinutes ?? 5;
  const check = canPerformCheckOut(record.checkInAt, now, minDuration);

  if (!check.canCheckOut) {
    return {
      success: false,
      error: `You just checked in. Please wait ${check.remainingMinutes} more minute${check.remainingMinutes === 1 ? '' : 's'} before checking out.`,
    };
  }

  const breakMinutes = checkInOutConfig.breakMinutes || 0;
  const dur = calculateAttendanceDuration(record.checkInAt, now, breakMinutes);
  const checkOutAtIso = now.toISOString();

  // 1. Update attendance record in Supabase
  const updatedRecord = await updateAttendanceCheckOut(record.id, {
    checkOutAt: checkOutAtIso,
    durationMinutes: dur.totalMinutes,
  });

  if (!updatedRecord) {
    return { success: false, error: 'Failed to update check-out record.' };
  }

  // 2. Sync update to Google Sheets (if form has googleSheetUrl)
  if (form.googleSheetUrl) {
    try {
      const settings = await getSettingsByFormId(formId);
      const sheetMatch = form.googleSheetUrl.match(/[-\w]{25,}/);
      const sheetId = sheetMatch ? sheetMatch[0] : '';

      if (sheetId && settings) {
        let accessToken = settings.googleAccessToken;
        if (form.userId && (settings.googleRefreshToken || accessToken)) {
          try {
            const { getValidAccessToken } = await import('@/lib/api/google-auth');
            accessToken = await getValidAccessToken({
              accessToken: settings.googleAccessToken,
              refreshToken: settings.googleRefreshToken,
              tokenExpiry: settings.googleTokenExpiry,
              userId: form.userId,
            });
          } catch (tokenErr) {
            console.warn('[attendance-checkout] Google token refresh error:', tokenErr);
          }
        }

        const sheetConfig = {
          sheetId,
          clientEmail: settings.googleClientEmail,
          privateKey: settings.googlePrivateKey
            ? formatPrivateKey(settings.googlePrivateKey)
            : undefined,
          accessToken,
        };

        const updateData: Record<string, string | number> = {
          'Masa Keluar (Check-Out)': formatAttendanceDateTime(now),
          'Jumlah Masa Hadir': dur.formattedText,
          'Jumlah Jam (Hours)': dur.decimalHours,
          'Status Kehadiran': 'Selesai (Completed)',
        };

        // Try updating by submission_id first
        let sheetRes = await updateSheetRow(
          sheetConfig,
          '_submission_id',
          record.submissionId,
          updateData
        );

        // Fallback 1: try matching by the identifier label from form/attendance record
        if (sheetRes.success && sheetRes.updated === false && record.identifierLabel) {
          sheetRes = await updateSheetRow(
            sheetConfig,
            record.identifierLabel,
            rawIdentifier.trim(),
            updateData
          );
        }

        // Fallback 2: try common IC / identifier header names
        if (sheetRes.success && sheetRes.updated === false) {
          const candidateHeaders = [
            'No. Kad Pengenalan',
            'No Kad Pengenalan',
            'No. IC',
            'No IC',
            'IC',
            'No. KP',
            'No KP',
            'Kad Pengenalan',
            'Email',
            'Emel',
          ];
          for (const cand of candidateHeaders) {
            sheetRes = await updateSheetRow(
              sheetConfig,
              cand,
              rawIdentifier.trim(),
              updateData
            );
            if (sheetRes.updated) break;
          }
        }
      }
    } catch (sheetErr) {
      console.warn('[attendance-checkout] Google Sheet sync error (non-fatal):', sheetErr);
    }
  }

  // 3. Update local form_responses if exists
  try {
    const admin = createAdminClient();
    const { data: resp } = await admin
      .from('form_responses')
      .select('data')
      .eq('submission_id', record.submissionId)
      .maybeSingle();

    if (resp && resp.data) {
      const existingData = resp.data as Record<string, unknown>;
      existingData['Masa Keluar (Check-Out)'] = formatAttendanceDateTime(now);
      existingData['Jumlah Masa Hadir'] = dur.formattedText;
      existingData['Jumlah Jam (Hours)'] = dur.decimalHours;
      existingData['Status Kehadiran'] = 'Selesai (Completed)';

      await admin
        .from('form_responses')
        .update({ data: existingData })
        .eq('submission_id', record.submissionId);
    }
  } catch (dbErr) {
    console.warn('[attendance-checkout] local form_responses update error:', dbErr);
  }

  return {
    success: true,
    summary: {
      status: 'completed',
      participantName: record.participantName,
      identifierValue: rawIdentifier,
      checkInTime: formatAttendanceTime(record.checkInAt),
      checkOutTime: formatAttendanceTime(now),
      durationFormatted: dur.formattedText,
      durationHours: dur.decimalHours,
      canCheckOut: false,
    },
  };
}

/**
 * Server action to fetch a live rotating QR payload for projector/presenter screen.
 */
export async function getRotatingQrLiveTokenAction(formId: string): Promise<{
  ok: boolean;
  payload?: RotatingQrPayload;
  formTitle?: string;
  intervalSeconds?: number;
  error?: string;
}> {
  if (!formId) {
    return { ok: false, error: 'Form ID is required.' };
  }

  const form = await getFormById(formId);
  if (!form) {
    return { ok: false, error: 'Form not found.' };
  }

  const rotatingConfig = form.attendanceSettings?.rotatingQr;
  if (!form.attendanceSettings?.enabled || !rotatingConfig?.enabled) {
    return { ok: false, error: 'Rotating QR mode is not enabled on this form.' };
  }

  const headersList = await getNextHeaders();
  const host = headersList.get('host') || 'www.klikform.com';
  const proto = headersList.get('x-forwarded-proto') || 'https';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  const intervalSeconds = rotatingConfig.intervalSeconds || DEFAULT_ROTATING_INTERVAL_SECONDS;
  const payload = generateRotatingQrPayload(appUrl, form.id, {
    intervalSeconds,
    secret: rotatingConfig.secret,
    timestampMs: Date.now(),
  });

  return {
    ok: true,
    payload,
    formTitle: form.title,
    intervalSeconds,
  };
}

/**
 * Server action to get attendance statistics for a form (owner only).
 */
export async function getAttendanceStatsAction(formId: string): Promise<{
  success: boolean;
  stats?: AttendanceStats;
  error?: string;
}> {
  if (!formId) {
    return { success: false, error: 'Form ID is required.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const form = await getFormById(formId);
  if (!form || form.userId !== user.id) {
    return { success: false, error: 'Form not found or unauthorized.' };
  }

  const stats = await getAttendanceStatsForForm(formId, user.id);
  return { success: true, stats };
}

/**
 * Server action to clear all attendance records for a form (owner only).
 * Resets both check-in/out records and local responses for fresh testing.
 */
export async function clearAttendanceRecordsAction(formId: string): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  if (!formId) {
    return { success: false, error: 'Form ID is required.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  const form = await getFormById(formId);
  if (!form || form.userId !== user.id) {
    return { success: false, error: 'Form not found or unauthorized.' };
  }

  const result = await clearAttendanceRecordsForForm(formId, user.id);
  if (!result.success) {
    return { success: false, error: result.error || 'Failed to clear attendance records.' };
  }

  revalidatePath(`/builder/${formId}`);
  revalidatePath('/responses');

  return { success: true, count: result.count };
}

