'use server';

import { headers as getNextHeaders } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getFormById } from '@/lib/storage/forms';
import { getSettingsByFormId } from '@/lib/storage/settings';
import {
  getAttendanceRecordsForParticipant,
  createAttendanceRecord,
  updateAttendanceCheckOut,
  getAttendanceStatsForForm,
  clearAttendanceRecordsForForm,
} from '@/lib/storage/attendance';
import {
  cleanIdentifier,
  calculateAttendanceDuration,
  calculateMultiDayAttendanceDuration,
  canPerformCheckOut,
  formatAttendanceTime,
  formatAttendanceDateTime,
  isEarlyCheckOut,
} from '@/lib/forms/attendance';
import { updateSheetRow } from '@/lib/api/google-sheets';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { AttendanceSummary, AttendanceStats, DailyAttendanceDetail } from '@/lib/types';
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
 * Server action to inspect a participant's attendance status for a form (multi-day aware).
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

  const totalDays = Math.max(1, checkInOutConfig.totalDays || 1);
  const records = await getAttendanceRecordsForParticipant(formId, cleanId);

  if (!records || records.length === 0) {
    return {
      ok: true,
      summary: {
        status: 'not_checked_in',
        identifierValue: rawIdentifier,
        dayNumber: 1,
        totalDays,
        completedDays: 0,
        isAllDaysCompleted: false,
      },
    };
  }

  const breakMinutes = checkInOutConfig.breakMinutes || 0;
  const minDuration = checkInOutConfig.minDurationMinutes ?? 5;
  const activeRecord = records.find((r) => r.status === 'checked_in');
  const completedRecords = records.filter((r) => r.status === 'completed' && r.checkOutAt);
  const participantName = records[0]?.participantName;

  if (activeRecord) {
    const check = canPerformCheckOut(activeRecord.checkInAt, new Date(), minDuration);
    const minHoursForCert = checkInOutConfig.minHoursForCertificate;
    const earlyCheck = minHoursForCert
      ? isEarlyCheckOut(activeRecord.checkInAt, new Date(), minHoursForCert, breakMinutes)
      : undefined;

    const multiDay = calculateMultiDayAttendanceDuration(completedRecords, breakMinutes);
    const currentDayNum = activeRecord.dayNumber ?? (completedRecords.length + 1);

    return {
      ok: true,
      summary: {
        status: 'checked_in',
        participantName,
        identifierValue: rawIdentifier,
        checkInTime: formatAttendanceTime(activeRecord.checkInAt),
        canCheckOut: check.canCheckOut,
        minDurationRemainingMinutes: check.remainingMinutes,
        checkInAtIso: activeRecord.checkInAt,
        minHoursForCertificate: minHoursForCert,
        isEarlyCheckOut: earlyCheck?.isEarly,
        earlyCheckOutShortfallText: earlyCheck?.shortfallText,
        dayNumber: currentDayNum,
        totalDays,
        completedDays: completedRecords.length,
        isAllDaysCompleted: false,
        totalAccumulatedMinutes: multiDay.totalMinutes,
        totalAccumulatedHours: multiDay.totalDecimalHours,
        totalAccumulatedFormatted: multiDay.formattedTotalText,
      },
    };
  }

  // All existing records are completed
  const multiDay = calculateMultiDayAttendanceDuration(completedRecords, breakMinutes);
  const latestRecord = completedRecords[completedRecords.length - 1] || records[records.length - 1];
  const completedCount = completedRecords.length;
  const canCheckInNextDay = completedCount < totalDays;
  const nextDayNumber = canCheckInNextDay ? completedCount + 1 : undefined;

  const dailyRecords: DailyAttendanceDetail[] = multiDay.dailyBreakdown.map((d) => ({
    dayNumber: d.dayNumber,
    checkInTime: formatAttendanceTime(d.checkInAt),
    checkOutTime: d.checkOutAt ? formatAttendanceTime(d.checkOutAt) : '',
    durationFormatted: d.duration.formattedText,
    durationHours: d.duration.decimalHours,
    status: 'completed',
  }));

  return {
    ok: true,
    summary: {
      status: 'completed',
      participantName,
      identifierValue: rawIdentifier,
      checkInTime: formatAttendanceTime(latestRecord.checkInAt),
      checkOutTime: latestRecord.checkOutAt ? formatAttendanceTime(latestRecord.checkOutAt) : '',
      durationFormatted: totalDays > 1 ? multiDay.formattedTotalText : (dailyRecords[0]?.durationFormatted || multiDay.formattedTotalText),
      durationHours: multiDay.totalDecimalHours,
      canCheckOut: false,
      dayNumber: latestRecord.dayNumber ?? completedCount,
      totalDays,
      completedDays: completedCount,
      isAllDaysCompleted: completedCount >= totalDays,
      canCheckInNextDay,
      nextDayNumber,
      totalAccumulatedMinutes: multiDay.totalMinutes,
      totalAccumulatedHours: multiDay.totalDecimalHours,
      totalAccumulatedFormatted: multiDay.formattedTotalText,
      dailyRecords,
    },
  };
}

/**
 * Server action to perform Check-In for returning participants on Day 2, Day 3, etc.
 * (1-click multi-day check-in without refilling form fields)
 */
export async function submitAttendanceCheckInAction(
  formId: string,
  rawIdentifier: string,
  targetDayNumber?: number,
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
  const rl = await checkRateLimit(ip, RATE_LIMITS.formSubmission, 'attendance-checkin');
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

  // Rotating QR verification (if enabled)
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

  const totalDays = Math.max(1, checkInOutConfig.totalDays || 1);
  const records = await getAttendanceRecordsForParticipant(formId, cleanId);

  // If active check-in already exists
  const activeRecord = records.find((r) => r.status === 'checked_in');
  if (activeRecord) {
    return {
      success: false,
      error: `You are already checked in for Day ${activeRecord.dayNumber ?? 1}.`,
    };
  }

  const completedRecords = records.filter((r) => r.status === 'completed' && r.checkOutAt);
  const nextDay = targetDayNumber || (completedRecords.length + 1);

  if (nextDay > totalDays) {
    return {
      success: false,
      error: `All ${totalDays} program days have already been completed.`,
    };
  }

  const nowCheckIn = new Date();
  const baseRecord = records[0];

  const newRecord = await createAttendanceRecord({
    formId: form.id,
    userId: form.userId || '',
    submissionId: baseRecord?.submissionId || 'manual-checkin',
    identifierValue: cleanId,
    identifierLabel: baseRecord?.identifierLabel || 'IC',
    participantName: baseRecord?.participantName,
    checkInAt: nowCheckIn.toISOString(),
    dayNumber: nextDay,
  });

  if (!newRecord) {
    return { success: false, error: 'Failed to record check-in.' };
  }

  // Update Google Sheet with Day X check-in
  if (form.googleSheetUrl && form.userId) {
    try {
      const settings = await getSettingsByFormId(formId);
      const sheetMatch = form.googleSheetUrl.match(/[-\w]{25,}/);
      const sheetId = sheetMatch ? sheetMatch[0] : '';

      if (sheetId && settings) {
        let accessToken = settings.googleAccessToken;
        if (settings.googleRefreshToken || accessToken) {
          try {
            const { getValidAccessToken } = await import('@/lib/api/google-auth');
            accessToken = await getValidAccessToken({
              accessToken: settings.googleAccessToken,
              refreshToken: settings.googleRefreshToken,
              tokenExpiry: settings.googleTokenExpiry,
              userId: form.userId,
            });
          } catch (tokenErr) {
            console.warn('[attendance-checkin] Google token refresh error:', tokenErr);
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

        if (totalDays > 1 && nextDay >= 2) {
          const { syncDailyAttendanceToSheet } = await import('@/lib/api/google-sheets');
          await syncDailyAttendanceToSheet({
            config: sheetConfig,
            dayNumber: nextDay,
            totalDays,
            participantName: baseRecord?.participantName,
            identifierLabel: baseRecord?.identifierLabel || 'No. IC',
            identifierValue: rawIdentifier.trim(),
            checkInTime: formatAttendanceDateTime(nowCheckIn),
            statusText: `Daftar Masuk (Hari ${nextDay})`,
            submissionId: baseRecord?.submissionId,
            masterSummary: {
              statusText: `Daftar Masuk (Hari ${nextDay}/${totalDays})`,
            },
          });
        } else {
          const updateData: Record<string, string | number> = {
            'Masa Masuk (Check-In)': formatAttendanceDateTime(nowCheckIn),
            'Masa Keluar (Check-Out)': '-',
            'Jumlah Masa Hadir': '-',
            'Jumlah Jam (Hours)': 0,
            'Status Kehadiran': 'Daftar Masuk (Checked-In)',
          };

          if (baseRecord?.submissionId) {
            await updateSheetRow(sheetConfig, '_submission_id', baseRecord.submissionId, updateData);
          } else {
            await updateSheetRow(sheetConfig, baseRecord?.identifierLabel || 'IC', rawIdentifier.trim(), updateData);
          }
        }
      }
    } catch (sheetErr) {
      console.warn('[attendance-checkin] Google Sheet sync error (non-fatal):', sheetErr);
    }
  }

  const multiDay = calculateMultiDayAttendanceDuration(completedRecords, checkInOutConfig.breakMinutes || 0);

  return {
    success: true,
    summary: {
      status: 'checked_in',
      participantName: baseRecord?.participantName,
      identifierValue: rawIdentifier,
      checkInTime: formatAttendanceTime(nowCheckIn),
      dayNumber: nextDay,
      totalDays,
      completedDays: completedRecords.length,
      isAllDaysCompleted: false,
      totalAccumulatedMinutes: multiDay.totalMinutes,
      totalAccumulatedHours: multiDay.totalDecimalHours,
      totalAccumulatedFormatted: multiDay.formattedTotalText,
      canCheckOut: false,
      minDurationRemainingMinutes: checkInOutConfig.minDurationMinutes ?? 5,
      checkInAtIso: nowCheckIn.toISOString(),
      minHoursForCertificate: checkInOutConfig.minHoursForCertificate,
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

  const records = await getAttendanceRecordsForParticipant(formId, cleanId);
  if (!records || records.length === 0) {
    return { success: false, error: 'Check-in record not found.' };
  }

  const totalDays = Math.max(1, checkInOutConfig.totalDays || 1);
  const activeRecord = records.find((r) => r.status === 'checked_in');
  const completedRecords = records.filter((r) => r.status === 'completed' && r.checkOutAt);

  if (!activeRecord) {
    const multiDay = calculateMultiDayAttendanceDuration(
      completedRecords,
      checkInOutConfig.breakMinutes || 0
    );
    const latest = completedRecords[completedRecords.length - 1] || records[records.length - 1];
    const isAllDone = completedRecords.length >= totalDays;

    return {
      success: true,
      summary: {
        status: 'completed',
        participantName: latest.participantName,
        identifierValue: rawIdentifier,
        checkInTime: formatAttendanceTime(latest.checkInAt),
        checkOutTime: latest.checkOutAt ? formatAttendanceTime(latest.checkOutAt) : '',
        durationFormatted: totalDays > 1 ? multiDay.formattedTotalText : (latest.durationMinutes ? `${Math.floor(latest.durationMinutes / 60)} Hours` : '0 Minutes'),
        durationHours: multiDay.totalDecimalHours,
        canCheckOut: false,
        dayNumber: latest.dayNumber,
        totalDays,
        completedDays: completedRecords.length,
        isAllDaysCompleted: isAllDone,
        canCheckInNextDay: !isAllDone,
        nextDayNumber: !isAllDone ? completedRecords.length + 1 : undefined,
        totalAccumulatedMinutes: multiDay.totalMinutes,
        totalAccumulatedHours: multiDay.totalDecimalHours,
        totalAccumulatedFormatted: multiDay.formattedTotalText,
      },
    };
  }

  const record = activeRecord;
  const dayNum = record.dayNumber ?? (completedRecords.length + 1);

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

  const allCompletedAfterThis = [
    ...completedRecords,
    { ...record, checkOutAt: checkOutAtIso, status: 'completed' as const, durationMinutes: dur.totalMinutes, dayNumber: dayNum },
  ];
  const multiDay = calculateMultiDayAttendanceDuration(allCompletedAfterThis, breakMinutes);
  const isAllDone = dayNum >= totalDays;

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

        if (totalDays > 1 && dayNum >= 2) {
          const { syncDailyAttendanceToSheet } = await import('@/lib/api/google-sheets');
          await syncDailyAttendanceToSheet({
            config: sheetConfig,
            dayNumber: dayNum,
            totalDays,
            participantName: record.participantName,
            identifierLabel: record.identifierLabel || 'No. IC',
            identifierValue: rawIdentifier.trim(),
            checkOutTime: formatAttendanceDateTime(now),
            durationHours: dur.decimalHours,
            statusText: `Hadir (Hari ${dayNum})`,
            submissionId: record.submissionId,
            masterSummary: {
              formattedTotalTime: multiDay.formattedTotalText,
              totalDecimalHours: multiDay.totalDecimalHours,
              statusText: isAllDone
                ? `Selesai Sepenuhnya (${totalDays}/${totalDays} Hari)`
                : `Hari ${dayNum} Selesai (${dayNum}/${totalDays} Hari)`,
            },
          });
        } else {
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
      if (totalDays > 1) {
        existingData[`Masa Keluar (Hari ${dayNum})`] = formatAttendanceDateTime(now);
        existingData[`Jumlah Jam (Hari ${dayNum})`] = dur.decimalHours;
        existingData['Jumlah Masa Hadir'] = multiDay.formattedTotalText;
        existingData['Jumlah Jam Keseluruhan (Total Hours)'] = multiDay.totalDecimalHours;
        existingData['Status Kehadiran'] = isAllDone
          ? `Selesai Sepenuhnya (${totalDays}/${totalDays} Hari)`
          : `Hari ${dayNum} Selesai (${dayNum}/${totalDays} Hari)`;
      } else {
        existingData['Masa Keluar (Check-Out)'] = formatAttendanceDateTime(now);
        existingData['Jumlah Masa Hadir'] = dur.formattedText;
        existingData['Jumlah Jam (Hours)'] = dur.decimalHours;
        existingData['Status Kehadiran'] = 'Selesai (Completed)';
      }

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
      durationFormatted: totalDays > 1 ? multiDay.formattedTotalText : dur.formattedText,
      durationHours: totalDays > 1 ? multiDay.totalDecimalHours : dur.decimalHours,
      canCheckOut: false,
      dayNumber: dayNum,
      totalDays,
      completedDays: completedRecords.length + 1,
      isAllDaysCompleted: isAllDone,
      canCheckInNextDay: !isAllDone,
      nextDayNumber: !isAllDone ? dayNum + 1 : undefined,
      totalAccumulatedMinutes: multiDay.totalMinutes,
      totalAccumulatedHours: multiDay.totalDecimalHours,
      totalAccumulatedFormatted: multiDay.formattedTotalText,
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

