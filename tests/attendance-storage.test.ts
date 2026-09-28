import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: m.from })),
}));

import {
  getAttendanceRecord,
  createAttendanceRecord,
  updateAttendanceCheckOut,
  listAttendanceRecordsForForm,
} from '@/lib/storage/attendance';

beforeEach(() => {
  vi.clearAllMocks();

  const queryChain: Record<string, unknown> = {
    insert: m.insert,
    select: m.select,
    update: m.update,
    eq: m.eq,
    order: m.order,
    limit: m.limit,
    maybeSingle: m.maybeSingle,
    single: m.single,
  };

  m.from.mockReturnValue(queryChain);
  m.select.mockReturnValue(queryChain);
  m.insert.mockReturnValue(queryChain);
  m.update.mockReturnValue(queryChain);
  m.eq.mockReturnValue(queryChain);
  m.order.mockReturnValue(queryChain);
  m.limit.mockReturnValue(queryChain);
  m.maybeSingle.mockResolvedValue({ data: null, error: null });
  m.single.mockResolvedValue({ data: null, error: null });
});

describe('Attendance Storage — getAttendanceRecord', () => {
  it('returns null if formId or cleanIdentifier is missing', async () => {
    expect(await getAttendanceRecord('', '123')).toBeNull();
    expect(await getAttendanceRecord('f1', '')).toBeNull();
  });

  it('queries Supabase and transforms db row to AttendanceRecord', async () => {
    const mockDbRow = {
      id: 'att-1',
      form_id: 'f1',
      user_id: 'u1',
      submission_id: 's1',
      identifier_value: '980101145555',
      identifier_label: 'No. KP',
      participant_name: 'Ahmad bin Ali',
      check_in_at: '2026-09-28T08:30:00Z',
      check_out_at: null,
      duration_minutes: null,
      status: 'checked_in',
      metadata: {},
      created_at: '2026-09-28T08:30:00Z',
      updated_at: '2026-09-28T08:30:00Z',
    };

    m.maybeSingle.mockResolvedValue({ data: mockDbRow, error: null });

    const result = await getAttendanceRecord('f1', '980101145555');

    expect(m.from).toHaveBeenCalledWith('attendance_records');
    expect(result).not.toBeNull();
    expect(result?.participantName).toBe('Ahmad bin Ali');
    expect(result?.status).toBe('checked_in');
  });
});

describe('Attendance Storage — createAttendanceRecord', () => {
  it('inserts row and returns transformed record', async () => {
    const mockCreated = {
      id: 'att-2',
      form_id: 'f1',
      user_id: 'u1',
      submission_id: 's2',
      identifier_value: '980101145555',
      identifier_label: 'IC',
      participant_name: 'Siti Aminah',
      check_in_at: '2026-09-28T08:00:00Z',
      check_out_at: null,
      duration_minutes: null,
      status: 'checked_in',
      metadata: {},
      created_at: '2026-09-28T08:00:00Z',
      updated_at: '2026-09-28T08:00:00Z',
    };

    m.single.mockResolvedValue({ data: mockCreated, error: null });

    const record = await createAttendanceRecord({
      formId: 'f1',
      userId: 'u1',
      submissionId: 's2',
      identifierValue: '980101145555',
      participantName: 'Siti Aminah',
    });

    expect(record).not.toBeNull();
    expect(record?.id).toBe('att-2');
    expect(record?.participantName).toBe('Siti Aminah');
    expect(record?.status).toBe('checked_in');
  });
});

describe('Attendance Storage — updateAttendanceCheckOut', () => {
  it('updates row with check-out time and duration', async () => {
    const mockUpdated = {
      id: 'att-2',
      form_id: 'f1',
      user_id: 'u1',
      submission_id: 's2',
      identifier_value: '980101145555',
      identifier_label: 'IC',
      participant_name: 'Siti Aminah',
      check_in_at: '2026-09-28T08:00:00Z',
      check_out_at: '2026-09-28T16:00:00Z',
      duration_minutes: 480,
      status: 'completed',
      metadata: {},
      created_at: '2026-09-28T08:00:00Z',
      updated_at: '2026-09-28T16:00:00Z',
    };

    m.single.mockResolvedValue({ data: mockUpdated, error: null });

    const record = await updateAttendanceCheckOut('att-2', {
      checkOutAt: '2026-09-28T16:00:00Z',
      durationMinutes: 480,
    });

    expect(record).not.toBeNull();
    expect(record?.status).toBe('completed');
    expect(record?.durationMinutes).toBe(480);
  });
});

describe('Attendance Storage — listAttendanceRecordsForForm', () => {
  it('lists all attendance records for a form', async () => {
    const mockList = [
      {
        id: 'att-1',
        form_id: 'f1',
        user_id: 'u1',
        submission_id: 's1',
        identifier_value: '980101145555',
        identifier_label: 'IC',
        participant_name: 'Ahmad',
        check_in_at: '2026-09-28T08:00:00Z',
        check_out_at: null,
        duration_minutes: null,
        status: 'checked_in',
        metadata: {},
        created_at: '2026-09-28T08:00:00Z',
        updated_at: '2026-09-28T08:00:00Z',
      },
    ];

    m.order.mockResolvedValue({ data: mockList, error: null });

    const records = await listAttendanceRecordsForForm('f1');
    expect(records).toHaveLength(1);
    expect(records[0].participantName).toBe('Ahmad');
  });
});
