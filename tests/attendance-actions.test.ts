import { describe, it, expect, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  RATE_LIMITS: { formSubmission: {} },
}));

const mockForm = {
  id: 'form-123',
  userId: 'user-123',
  title: 'Bengkel AI 2026',
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/123456789012345678901234567890/edit',
  fields: [
    { id: 'f-name', type: 'text', label: 'Nama Penuh', required: true },
    { id: 'f-ic', type: 'text', label: 'No. Kad Pengenalan', required: true },
  ],
  attendanceSettings: {
    enabled: true,
    checkInOut: {
      enabled: true,
      identifierFieldId: 'f-ic',
      minDurationMinutes: 5,
      breakMinutes: 0,
    },
  },
};

vi.mock('@/lib/storage/forms', () => ({
  getFormById: vi.fn().mockImplementation((id: string) => {
    if (id === 'form-123') return Promise.resolve(mockForm);
    return Promise.resolve(null);
  }),
}));

vi.mock('@/lib/storage/settings', () => ({
  getSettingsByFormId: vi.fn().mockResolvedValue({
    googleAccessToken: 'fake-token',
  }),
}));

const mockAttendanceRecord = {
  id: 'rec-1',
  formId: 'form-123',
  userId: 'user-123',
  submissionId: 'sub-1',
  identifierValue: '950101145555',
  identifierLabel: 'No. Kad Pengenalan',
  participantName: 'Ahmad bin Ali',
  checkInAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  checkOutAt: null,
  durationMinutes: null,
  status: 'checked_in',
  createdAt: new Date(Date.now() - 3600000).toISOString(),
};

vi.mock('@/lib/storage/attendance', () => ({
  getAttendanceRecord: vi.fn().mockImplementation((formId: string, cleanId: string) => {
    if (formId === 'form-123' && cleanId === '950101145555') {
      return Promise.resolve(mockAttendanceRecord);
    }
    return Promise.resolve(null);
  }),
  updateAttendanceCheckOut: vi.fn().mockImplementation((id: string, input: { durationMinutes: number }) => {
    return Promise.resolve({
      ...mockAttendanceRecord,
      status: 'completed',
      checkOutAt: new Date().toISOString(),
      durationMinutes: input.durationMinutes,
    });
  }),
}));

vi.mock('@/lib/api/google-sheets', () => ({
  updateSheetRow: vi.fn().mockResolvedValue({ success: true, updated: true }),
}));

vi.mock('@/lib/api/google-auth', () => ({
  getValidAccessToken: vi.fn().mockImplementation((params: { accessToken?: string }) => Promise.resolve(params.accessToken)),
}));

vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  })),
}));

import {
  checkAttendanceStatusAction,
  submitAttendanceCheckOutAction,
} from '@/actions/attendance';

describe('Attendance Server Actions — checkAttendanceStatusAction', () => {
  it('returns not_checked_in when no record found', async () => {
    const res = await checkAttendanceStatusAction('form-123', '000000-00-0000');
    expect(res.ok).toBe(true);
    expect(res.summary?.status).toBe('not_checked_in');
  });

  it('returns checked_in with canCheckOut=true when elapsed time is sufficient', async () => {
    const res = await checkAttendanceStatusAction('form-123', '950101-14-5555');
    expect(res.ok).toBe(true);
    expect(res.summary?.status).toBe('checked_in');
    expect(res.summary?.participantName).toBe('Ahmad bin Ali');
    expect(res.summary?.canCheckOut).toBe(true);
  });
});

describe('Attendance Server Actions — submitAttendanceCheckOutAction', () => {
  it('successfully checks out participant and calculates duration', async () => {
    const res = await submitAttendanceCheckOutAction('form-123', '950101-14-5555');
    expect(res.success).toBe(true);
    expect(res.summary?.status).toBe('completed');
    expect(res.summary?.durationHours).toBeGreaterThanOrEqual(1.0);
    expect(res.summary?.durationFormatted).toContain('Jam');
  });

  it('fails if no active check-in record exists', async () => {
    const res = await submitAttendanceCheckOutAction('form-123', '999999-99-9999');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Rekod daftar masuk');
  });

  it('falls back to identifier column if _submission_id update returns updated=false', async () => {
    const { updateSheetRow } = await import('@/lib/api/google-sheets');
    vi.mocked(updateSheetRow).mockResolvedValueOnce({ success: true, updated: false })
      .mockResolvedValueOnce({ success: true, updated: true });

    const res = await submitAttendanceCheckOutAction('form-123', '950101-14-5555');
    expect(res.success).toBe(true);
    expect(updateSheetRow).toHaveBeenCalledWith(
      expect.anything(),
      'No. Kad Pengenalan',
      '950101-14-5555',
      expect.objectContaining({ 'Status Kehadiran': 'Selesai (Completed)' })
    );
  });
});
