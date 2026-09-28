import 'server-only';
import { createAdminClient } from '@/utils/supabase/admin';
import { AttendanceRecord, AttendanceStatus } from '@/lib/types';

interface DbRow {
  id: string;
  form_id: string;
  user_id: string;
  submission_id: string;
  identifier_value: string;
  identifier_label: string;
  participant_name: string | null;
  check_in_at: string;
  check_out_at: string | null;
  duration_minutes: number | null;
  status: AttendanceStatus;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: DbRow): AttendanceRecord {
  return {
    id: row.id,
    formId: row.form_id,
    userId: row.user_id,
    submissionId: row.submission_id,
    identifierValue: row.identifier_value,
    identifierLabel: row.identifier_label,
    participantName: row.participant_name ?? undefined,
    checkInAt: row.check_in_at,
    checkOutAt: row.check_out_at,
    durationMinutes: row.duration_minutes,
    status: row.status,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get active attendance record for a participant in a specific form.
 * Matches by form_id and cleaned identifier (IC, Email, etc.).
 */
export async function getAttendanceRecord(
  formId: string,
  cleanIdentifierVal: string
): Promise<AttendanceRecord | null> {
  if (!formId || !cleanIdentifierVal) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('attendance_records')
      .select('*')
      .eq('form_id', formId)
      .eq('identifier_value', cleanIdentifierVal)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[attendance-storage] getAttendanceRecord error:', error);
      return null;
    }

    if (!data) return null;
    return rowToRecord(data as DbRow);
  } catch (err) {
    console.error('[attendance-storage] getAttendanceRecord exception:', err);
    return null;
  }
}

/**
 * Create a new check-in attendance record.
 */
export async function createAttendanceRecord(input: {
  formId: string;
  userId: string;
  submissionId: string;
  identifierValue: string;
  identifierLabel?: string;
  participantName?: string;
  checkInAt?: string;
  metadata?: Record<string, unknown>;
}): Promise<AttendanceRecord | null> {
  try {
    const admin = createAdminClient();
    const checkInTime = input.checkInAt || new Date().toISOString();

    const insertPayload = {
      form_id: input.formId,
      user_id: input.userId,
      submission_id: input.submissionId,
      identifier_value: input.identifierValue,
      identifier_label: input.identifierLabel || 'IC',
      participant_name: input.participantName || null,
      check_in_at: checkInTime,
      status: 'checked_in',
      metadata: input.metadata || {},
    };

    const { data, error } = await admin
      .from('attendance_records')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      console.error('[attendance-storage] createAttendanceRecord error:', error);
      return null;
    }

    return rowToRecord(data as DbRow);
  } catch (err) {
    console.error('[attendance-storage] createAttendanceRecord exception:', err);
    return null;
  }
}

/**
 * Record check-out time and duration for an attendance record.
 */
export async function updateAttendanceCheckOut(
  recordId: string,
  input: {
    checkOutAt?: string;
    durationMinutes: number;
    metadata?: Record<string, unknown>;
  }
): Promise<AttendanceRecord | null> {
  try {
    const admin = createAdminClient();
    const checkOutTime = input.checkOutAt || new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      check_out_at: checkOutTime,
      duration_minutes: input.durationMinutes,
      status: 'completed',
      updated_at: new Date().toISOString(),
    };

    if (input.metadata) {
      updatePayload.metadata = input.metadata;
    }

    const { data, error } = await admin
      .from('attendance_records')
      .update(updatePayload)
      .eq('id', recordId)
      .select('*')
      .single();

    if (error) {
      console.error('[attendance-storage] updateAttendanceCheckOut error:', error);
      return null;
    }

    return rowToRecord(data as DbRow);
  } catch (err) {
    console.error('[attendance-storage] updateAttendanceCheckOut exception:', err);
    return null;
  }
}

/**
 * List all attendance records for a form (owner view).
 */
export async function listAttendanceRecordsForForm(
  formId: string
): Promise<AttendanceRecord[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('attendance_records')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[attendance-storage] listAttendanceRecords error:', error);
      return [];
    }

    return (data as DbRow[]).map(rowToRecord);
  } catch (err) {
    console.error('[attendance-storage] listAttendanceRecords exception:', err);
    return [];
  }
}
