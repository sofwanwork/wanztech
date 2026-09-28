'use server';

import { headers as getNextHeaders } from 'next/headers';
import { getFormById } from '@/lib/storage/forms';
import { getSettingsByFormId } from '@/lib/storage/settings';
import {
  getAttendanceRecord,
  updateAttendanceCheckOut,
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
import { AttendanceSummary } from '@/lib/types';
import { createAdminClient } from '@/utils/supabase/admin';
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
    return { ok: false, error: 'Borang dan pengenalan diperlukan.' };
  }

  // Rate limit
  const headersList = await getNextHeaders();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(ip, RATE_LIMITS.formSubmission, 'attendance-check');
  if (!rl.success) {
    return { ok: false, error: 'Terlalu banyak percubaan. Sila cuba sebentar lagi.' };
  }

  const cleanId = cleanIdentifier(rawIdentifier);
  if (!cleanId) {
    return { ok: false, error: 'Pengenalan tidak sah.' };
  }

  const form = await getFormById(formId);
  if (!form) {
    return { ok: false, error: 'Borang tidak dijumpai.' };
  }

  const checkInOutConfig = form.attendanceSettings?.checkInOut;
  if (!form.attendanceSettings?.enabled || !checkInOutConfig?.enabled) {
    return { ok: false, error: 'Mod kehadiran pintar tidak diaktifkan pada borang ini.' };
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
    return { success: false, error: 'Borang dan pengenalan diperlukan.' };
  }

  // Rate limit
  const headersList = await getNextHeaders();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(ip, RATE_LIMITS.formSubmission, 'attendance-checkout');
  if (!rl.success) {
    return { success: false, error: 'Terlalu banyak percubaan. Sila cuba sebentar lagi.' };
  }

  const cleanId = cleanIdentifier(rawIdentifier);
  const form = await getFormById(formId);
  if (!form) {
    return { success: false, error: 'Borang tidak dijumpai.' };
  }

  const checkInOutConfig = form.attendanceSettings?.checkInOut;
  if (!form.attendanceSettings?.enabled || !checkInOutConfig?.enabled) {
    return { success: false, error: 'Mod kehadiran pintar tidak aktif.' };
  }

  // Passcode verification (Solution 2)
  if (checkInOutConfig.checkOutPasscode && checkInOutConfig.checkOutPasscode.trim()) {
    const expected = checkInOutConfig.checkOutPasscode.trim();
    const actual = (passcode || '').trim();
    if (!actual || actual !== expected) {
      return {
        success: false,
        error: 'Kod PIN Check-Out tidak sah. Sila masukkan PIN yang betul daripada penceramah/urusetia.',
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
          'Kod QR ini telah luput atau tidak sah. Sila imbas kod QR langsung yang sedang dipaparkan di skrin dewan.',
      };
    }
  }

  const record = await getAttendanceRecord(formId, cleanId);
  if (!record) {
    return { success: false, error: 'Rekod daftar masuk (check-in) tidak dijumpai.' };
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
      error: `Anda baru sahaja mendaftar masuk. Sila tunggu ${check.remainingMinutes} minit lagi sebelum mendaftar keluar.`,
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
    return { success: false, error: 'Gagal mengemaskini rekod daftar keluar.' };
  }

  // 2. Sync update to Google Sheets (if form has googleSheetUrl)
  if (form.googleSheetUrl) {
    try {
      const settings = await getSettingsByFormId(formId);
      const sheetMatch = form.googleSheetUrl.match(/[-\w]{25,}/);
      const sheetId = sheetMatch ? sheetMatch[0] : '';

      if (sheetId && settings) {
        const updateData: Record<string, string | number> = {
          'Masa Keluar (Check-Out)': formatAttendanceDateTime(now),
          'Jumlah Masa Hadir': dur.formattedText,
          'Jumlah Jam (Hours)': dur.decimalHours,
          'Status Kehadiran': 'Selesai (Completed)',
        };

        // Try updating by submission_id first
        await updateSheetRow(
          {
            sheetId,
            clientEmail: settings.googleClientEmail,
            privateKey: settings.googlePrivateKey
              ? formatPrivateKey(settings.googlePrivateKey)
              : undefined,
            accessToken: settings.googleAccessToken,
          },
          '_submission_id',
          record.submissionId,
          updateData
        );
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
    return { ok: false, error: 'Borang diperlukan.' };
  }

  const form = await getFormById(formId);
  if (!form) {
    return { ok: false, error: 'Borang tidak dijumpai.' };
  }

  const rotatingConfig = form.attendanceSettings?.rotatingQr;
  if (!form.attendanceSettings?.enabled || !rotatingConfig?.enabled) {
    return { ok: false, error: 'Mod Rotating QR tidak diaktifkan pada borang ini.' };
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

