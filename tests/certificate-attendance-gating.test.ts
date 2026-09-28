import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkCertificateByICOrEmail, getFormForCertificateCheck } from '@/actions/certificates';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  RATE_LIMITS: { certificateCheck: {} },
}));

const mockFormWithGating = {
  id: 'form-gated',
  userId: 'user-1',
  title: 'Kursus Keselamatan AI 2026',
  eCertificateEnabled: true,
  eCertificateTemplate: 'classic',
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/test-sheet-id/edit',
  fields: [
    { id: 'f-name', type: 'text', label: 'Nama Penuh', required: true },
    { id: 'f-ic', type: 'text', label: 'No. Kad Pengenalan', required: true },
    { id: 'f-email', type: 'email', label: 'Email', required: false },
  ],
  attendanceSettings: {
    enabled: true,
    checkInOut: {
      enabled: true,
      identifierFieldId: 'f-ic',
      minDurationMinutes: 5,
      breakMinutes: 0,
      minHoursForCertificate: 6, // 6 Hours required
    },
  },
};

const mockFormWithoutGating = {
  id: 'form-ungated',
  userId: 'user-1',
  title: 'Seminar Awam',
  eCertificateEnabled: true,
  eCertificateTemplate: 'modern',
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/test-sheet-id/edit',
  fields: [
    { id: 'f-name', type: 'text', label: 'Nama Penuh', required: true },
    { id: 'f-ic', type: 'text', label: 'No. Kad Pengenalan', required: true },
  ],
  attendanceSettings: {
    enabled: false,
  },
};

vi.mock('@/lib/storage/forms', () => ({
  getFormById: vi.fn().mockImplementation((id: string) => {
    if (id === 'form-gated') return Promise.resolve(mockFormWithGating);
    if (id === 'form-ungated') return Promise.resolve(mockFormWithoutGating);
    return Promise.resolve(null);
  }),
}));

vi.mock('@/lib/storage/settings', () => ({
  getSettingsByFormId: vi.fn().mockResolvedValue({
    googleAccessToken: 'fake-token',
  }),
}));

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        setCredentials: vi.fn(),
      })),
    },
  },
}));

let currentAttendanceRecord: Record<string, unknown> | null = null;

vi.mock('@/lib/storage/attendance', () => ({
  getAttendanceRecord: vi.fn().mockImplementation(() => Promise.resolve(currentAttendanceRecord)),
}));

vi.mock('google-spreadsheet', () => {
  return {
    GoogleSpreadsheet: vi.fn().mockImplementation(() => ({
      loadInfo: vi.fn().mockResolvedValue(undefined),
      sheetsByIndex: [
        {
          loadHeaderRow: vi.fn().mockResolvedValue(undefined),
          headerValues: ['Nama Penuh', 'No. Kad Pengenalan', 'Email', 'Tarikh'],
          getRows: vi.fn().mockResolvedValue([
            {
              get: vi.fn().mockImplementation((col: string) => {
                if (col === 'Nama Penuh') return 'Siti Khadijah';
                if (col === 'No. Kad Pengenalan') return '990202-14-1234';
                if (col === 'Email') return 'siti@example.com';
                if (col === 'Tarikh') return '28/09/2026';
                return '';
              }),
            },
          ]),
        },
      ],
    })),
  };
});

describe('Certificate Attendance Gating — checkCertificateByICOrEmail', () => {
  beforeEach(() => {
    currentAttendanceRecord = null;
  });

  it('blocks certificate claiming when participant has no attendance record in gated form', async () => {
    currentAttendanceRecord = null;
    const res = await checkCertificateByICOrEmail('form-gated', '990202141234');

    expect(res.found).toBe(false);
    expect(res.attendanceIneligible).toBe(true);
    expect(res.attendanceDetails?.status).toBe('no_record');
    expect(res.attendanceDetails?.requiredHours).toBe(6);
    expect(res.error).toContain('Tiada rekod pendaftaran masuk');
  });

  it('blocks certificate claiming when participant has not checked out yet', async () => {
    currentAttendanceRecord = {
      id: 'rec-1',
      formId: 'form-gated',
      status: 'checked_in',
      checkInAt: '2026-09-28T08:00:00.000Z',
      checkOutAt: null,
      durationMinutes: null,
    };
    const res = await checkCertificateByICOrEmail('form-gated', '990202141234');

    expect(res.found).toBe(false);
    expect(res.attendanceIneligible).toBe(true);
    expect(res.attendanceDetails?.status).toBe('not_checked_out');
    expect(res.error).toContain('belum mendaftar keluar');
  });

  it('blocks certificate claiming when total hours attended is less than required (e.g. 3 hours vs 6 hours)', async () => {
    currentAttendanceRecord = {
      id: 'rec-1',
      formId: 'form-gated',
      status: 'completed',
      checkInAt: '2026-09-28T08:00:00.000Z',
      checkOutAt: '2026-09-28T11:00:00.000Z', // 3 hours
      durationMinutes: 180,
    };
    const res = await checkCertificateByICOrEmail('form-gated', '990202141234');

    expect(res.found).toBe(false);
    expect(res.attendanceIneligible).toBe(true);
    expect(res.attendanceDetails?.status).toBe('insufficient_hours');
    expect(res.attendanceDetails?.attendedHours).toBe(3);
    expect(res.attendanceDetails?.requiredHours).toBe(6);
    expect(res.attendanceDetails?.shortfallText).toBe('3 Jam');
    expect(res.error).toContain('3 Jam');
    expect(res.error).toContain('kurang 3 Jam');
  });

  it('permits certificate claiming when total hours attended meets or exceeds required', async () => {
    currentAttendanceRecord = {
      id: 'rec-1',
      formId: 'form-gated',
      status: 'completed',
      checkInAt: '2026-09-28T08:00:00.000Z',
      checkOutAt: '2026-09-28T15:30:00.000Z', // 7.5 hours
      durationMinutes: 450,
    };
    const res = await checkCertificateByICOrEmail('form-gated', '990202141234');

    expect(res.found).toBe(true);
    expect(res.name).toBe('Siti Khadijah');
    expect(res.programName).toBe('Kursus Keselamatan AI 2026');
    expect(res.attendanceIneligible).toBeUndefined();
  });

  it('permits certificate claiming when form has no attendance requirement', async () => {
    const res = await checkCertificateByICOrEmail('form-ungated', '990202141234');

    expect(res.found).toBe(true);
    expect(res.name).toBe('Siti Khadijah');
    expect(res.programName).toBe('Seminar Awam');
  });
});

describe('Certificate Attendance Gating — getFormForCertificateCheck', () => {
  it('returns minHoursRequired correctly for gated form', async () => {
    const form = await getFormForCertificateCheck('form-gated');
    expect(form?.minHoursRequired).toBe(6);
  });

  it('returns minHoursRequired = 0 for ungated form', async () => {
    const form = await getFormForCertificateCheck('form-ungated');
    expect(form?.minHoursRequired).toBe(0);
  });
});
