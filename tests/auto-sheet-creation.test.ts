/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react', async () => {
  const actual = await vi.importActual<any>('react');
  return {
    ...actual,
    cache: (fn: any) => fn,
  };
});

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: 'u1', email: 'test@example.com' } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })),
  })),
}));

const mockCreateSpreadsheet = vi.fn();
const mockBatchUpdate = vi.fn();
const mockPermissionsCreate = vi.fn();
const mockFilesUpdate = vi.fn();

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        setCredentials: vi.fn(),
        refreshAccessToken: vi.fn(async () => ({
          credentials: { access_token: 'new-refreshed-token', expiry_date: Date.now() + 3600000 },
        })),
      })),
    },
    sheets: vi.fn().mockImplementation(() => ({
      spreadsheets: {
        create: mockCreateSpreadsheet,
        batchUpdate: mockBatchUpdate,
      },
    })),
    drive: vi.fn().mockImplementation(() => ({
      permissions: {
        create: mockPermissionsCreate,
      },
      files: {
        update: mockFilesUpdate,
      },
    })),
  },
}));

vi.mock('google-auth-library', () => ({
  JWT: vi.fn().mockImplementation(() => ({})),
}));

import {
  createGoogleSpreadsheetHelper,
  updateGoogleSpreadsheetTitle,
} from '@/actions/sheets';
import type { Settings } from '@/lib/types';

describe('Auto Google Sheet Creation & Title Synchronization Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails gracefully when no Google credentials are configured in Settings', async () => {
    const emptySettings: Settings = {};
    const result = await createGoogleSpreadsheetHelper('My Form', emptySettings);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/credentials not configured/i);
    expect(result.url).toBeUndefined();
  });

  it('creates Google Sheet successfully via OAuth and returns spreadsheet URL', async () => {
    mockCreateSpreadsheet.mockResolvedValueOnce({
      data: { spreadsheetId: 'sheet-123-abc' },
    });

    const oauthSettings: Settings = {
      googleAccessToken: 'valid-token',
    };

    const result = await createGoogleSpreadsheetHelper('Borang Pendaftaran', oauthSettings);

    expect(result.success).toBe(true);
    expect(result.spreadsheetId).toBe('sheet-123-abc');
    expect(result.url).toBe('https://docs.google.com/spreadsheets/d/sheet-123-abc');
    expect(mockCreateSpreadsheet).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({
          properties: { title: 'Borang Pendaftaran - Responses' },
        }),
      })
    );
  });

  it('creates Google Sheet successfully via Service Account and grants writer permission', async () => {
    mockCreateSpreadsheet.mockResolvedValueOnce({
      data: { spreadsheetId: 'sheet-sa-999' },
    });
    mockPermissionsCreate.mockResolvedValueOnce({ data: { id: 'perm-1' } });

    const saSettings: Settings = {
      googleClientEmail: 'service@project.iam.gserviceaccount.com',
      googlePrivateKey: '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\\n-----END PRIVATE KEY-----\\n',
      userPersonalEmail: 'owner@example.com',
    };

    const result = await createGoogleSpreadsheetHelper('Event RSVP', saSettings, 'owner@example.com');

    expect(result.success).toBe(true);
    expect(result.spreadsheetId).toBe('sheet-sa-999');
    expect(result.url).toBe('https://docs.google.com/spreadsheets/d/sheet-sa-999');
    expect(mockPermissionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'sheet-sa-999',
        requestBody: expect.objectContaining({
          role: 'writer',
          type: 'user',
          emailAddress: 'owner@example.com',
        }),
      })
    );
  });

  it('updates Google Spreadsheet title when form title changes via updateGoogleSpreadsheetTitle', async () => {
    mockBatchUpdate.mockResolvedValueOnce({ data: {} });

    const oauthSettings: Settings = {
      googleAccessToken: 'valid-token',
    };

    const result = await updateGoogleSpreadsheetTitle(
      'https://docs.google.com/spreadsheets/d/sheet-xyz-789/edit',
      'Mesyuarat Pasukan Web 2026',
      oauthSettings
    );

    expect(result.success).toBe(true);
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: 'sheet-xyz-789',
        requestBody: expect.objectContaining({
          requests: [
            expect.objectContaining({
              updateSpreadsheetProperties: expect.objectContaining({
                properties: {
                  title: 'Mesyuarat Pasukan Web 2026 - Responses',
                },
                fields: 'title',
              }),
            }),
          ],
        }),
      })
    );
  });
});
