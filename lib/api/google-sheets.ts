import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export interface SheetConfig {
  sheetId: string;
  clientEmail?: string;
  privateKey?: string;
  folderId?: string;
  accessToken?: string;
}

export async function getGoogleSheetsAuth(config: SheetConfig, readOnly = false) {
  if (config.accessToken) {
    const { google } = await import('googleapis');
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: config.accessToken });
    return oauth2Client;
  }
  if (config.clientEmail && config.privateKey) {
    return new JWT({
      email: config.clientEmail,
      key: config.privateKey,
      scopes: [
        readOnly
          ? 'https://www.googleapis.com/auth/spreadsheets.readonly'
          : 'https://www.googleapis.com/auth/spreadsheets',
      ],
    });
  }
  throw new Error('Missing credentials (either Access Token or Service Account)');
}

export function sanitizeSheetValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  const stringValue = String(value);
  if (
    stringValue.startsWith('=') ||
    stringValue.startsWith('+') ||
    stringValue.startsWith('-') ||
    stringValue.startsWith('@')
  ) {
    return "'" + stringValue;
  }
  return stringValue;
}

/**
 * Ensures header names are valid for Google Spreadsheet:
 * - Trims whitespace
 * - Assigns fallback name for blank headers (e.g. Kolom_1)
 * - Automatically resolves duplicates by suffixing (e.g. "Soalan (2)", "Soalan (3)")
 */
export function sanitizeHeaders(rawHeaders: string[]): string[] {
  const seen = new Map<string, number>();
  return rawHeaders.map((rawHeader, idx) => {
    let trimmed = (rawHeader ?? '').toString().trim();
    if (!trimmed) {
      trimmed = `Kolom_${idx + 1}`;
    }
    const count = seen.get(trimmed) || 0;
    seen.set(trimmed, count + 1);
    if (count > 0) {
      return `${trimmed} (${count + 1})`;
    }
    return trimmed;
  });
}

/**
 * Checks if the Google Spreadsheet worksheet has enough columns to fit
 * `requiredColumns`. Google Sheets default to 26 columns (A-Z). When forms
 * contain many questions (e.g. 18 scale questions + base fields > 26 columns),
 * google-spreadsheet's setHeaderRow() throws:
 * "Sheet is not large enough to fit X columns. Resize the sheet first."
 *
 * This function automatically resizes the sheet with generous padding (+10 columns)
 * so headers can be set and rows can be appended without errors.
 */
export async function ensureSheetCapacity(
  sheet: {
    columnCount?: number;
    rowCount?: number;
    resize?: (gridProperties: { rowCount: number; columnCount: number }) => Promise<unknown>;
  },
  requiredColumns: number
): Promise<void> {
  const currentCols = typeof sheet.columnCount === 'number' ? sheet.columnCount : 26;
  if (requiredColumns > currentCols) {
    const targetCols = Math.max(requiredColumns + 10, currentCols + 10);
    const currentRowCount =
      typeof sheet.rowCount === 'number' && sheet.rowCount > 0 ? sheet.rowCount : 1000;
    console.log(
      `[Google Sheets] Auto-resizing sheet from ${currentCols} to ${targetCols} columns (needed: ${requiredColumns})`
    );
    if (typeof sheet.resize === 'function') {
      await sheet.resize({
        columnCount: targetCols,
        rowCount: currentRowCount,
      });
    }
  }
}

export async function appendToSheet(
  config: SheetConfig,
  data: Record<string, string | number | boolean | null | undefined>
) {
  try {
    const auth = await getGoogleSheetsAuth(config);
    const doc = new GoogleSpreadsheet(config.sheetId, auth);

    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0]; // Always append to the first sheet

    // Check if headers exist
    let headers: string[] = [];
    try {
      await sheet.loadHeaderRow();
      headers = sheet.headerValues;
    } catch (e) {
      // likely empty sheet, continue to set headers
      console.log('Header load failed (expected for new sheet):', e);
    }

    // Filter out blank keys from data
    const validDataKeys = Object.keys(data)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // If sheet is new/empty, headerValues might be empty array
    if (!headers || headers.length === 0) {
      console.log('Setting new headers...');
      // Create headers from the keys
      const newHeaders = sanitizeHeaders(validDataKeys);
      await ensureSheetCapacity(sheet, newHeaders.length);
      await sheet.setHeaderRow(newHeaders);

      // Reload headers to be safe
      await sheet.loadHeaderRow();
    } else {
      // Check if there are new fields in data that do not exist in the current headers
      const existingHeaders = headers.map((h) => h.trim());
      const missingHeaders = validDataKeys.filter((key) => !existingHeaders.includes(key));

      if (missingHeaders.length > 0) {
        console.log('Appending new headers:', missingHeaders);
        const updatedHeaders = sanitizeHeaders([...headers, ...missingHeaders]);
        await ensureSheetCapacity(sheet, updatedHeaders.length);
        await sheet.setHeaderRow(updatedHeaders);
        await sheet.loadHeaderRow();
      }
    }

    // Sanitize data: convert null/undefined to empty string to satisfy google-spreadsheet types
    const sanitizedData: Record<string, string | number | boolean> = {};
    Object.entries(data).forEach(([key, value]) => {
      const trimmedKey = key.trim();
      let sanitizedVal: string | number | boolean = '';
      if (value !== null && value !== undefined) {
        if (typeof value === 'number' || typeof value === 'boolean') {
          sanitizedVal = value;
        } else {
          // Prevent CSV Injection / Formula Injection
          let stringValue = String(value);
          if (
            stringValue.startsWith('=') ||
            stringValue.startsWith('+') ||
            stringValue.startsWith('-') ||
            stringValue.startsWith('@')
          ) {
            stringValue = "'" + stringValue;
          }
          sanitizedVal = stringValue;
        }
      }
      sanitizedData[key] = sanitizedVal;
      if (trimmedKey !== key) {
        sanitizedData[trimmedKey] = sanitizedVal;
      }
    });

    await sheet.addRow(sanitizedData);
    return { success: true };
  } catch (error) {
    console.error('Google Sheet Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing row identified by a value in `matchColumn`.
 * Used by the response-edit flow: rows are tagged with a hidden
 * `_submission_id` on insert, then located + rewritten here.
 *
 * Returns `{ success: true, updated: true }` on a hit, `updated: false`
 * if no row matched (caller can decide to fall back to append).
 */
export async function updateSheetRow(
  config: SheetConfig,
  matchColumn: string,
  matchValue: string,
  data: Record<string, string | number | boolean | null | undefined>
): Promise<{ success: boolean; updated?: boolean; error?: string }> {
  try {
    let auth;
    if (config.accessToken) {
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: config.accessToken });
      auth = oauth2Client;
    } else if (config.clientEmail && config.privateKey) {
      // Only Sheets API operations below — `spreadsheets` scope suffices.
      auth = new JWT({
        email: config.clientEmail,
        key: config.privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      throw new Error('Missing credentials (either Access Token or Service Account)');
    }

    const doc = new GoogleSpreadsheet(config.sheetId, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    const validDataKeys = Object.keys(data)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    const existingHeaders = headers.map((h) => h.trim());
    const missingHeaders = validDataKeys.filter((key) => !existingHeaders.includes(key));
    if (missingHeaders.length > 0) {
      const updatedHeaders = sanitizeHeaders([...headers, ...missingHeaders]);
      await ensureSheetCapacity(sheet, updatedHeaders.length);
      await sheet.setHeaderRow(updatedHeaders);
      await sheet.loadHeaderRow();
    }

    const rows = await sheet.getRows();
    const cleanMatch = matchValue.replace(/[\s\-_/]/g, '').toLowerCase();
    const cleanColName = matchColumn.replace(/[\s\-_/]/g, '').toLowerCase();
    const actualCol =
      headers.find(
        (h) =>
          h === matchColumn ||
          h.trim().toLowerCase() === matchColumn.trim().toLowerCase() ||
          h.replace(/[\s\-_/]/g, '').toLowerCase() === cleanColName
      ) || matchColumn;

    const target = rows.find((r) => {
      const cellVal = String(r.get(actualCol) ?? r.get(matchColumn) ?? '');
      if (cellVal === matchValue) return true;
      if (cleanMatch && cellVal.replace(/[\s\-_/]/g, '').toLowerCase() === cleanMatch) {
        return true;
      }
      return false;
    });
    if (!target) {
      return { success: true, updated: false };
    }

    for (const [key, value] of Object.entries(data)) {
      let stringValue =
        value === null || value === undefined ? '' : String(value);
      if (
        stringValue.startsWith('=') ||
        stringValue.startsWith('+') ||
        stringValue.startsWith('-') ||
        stringValue.startsWith('@')
      ) {
        stringValue = "'" + stringValue;
      }
      target.set(key, stringValue);
    }
    await target.save();

    return { success: true, updated: true };
  } catch (error) {
    console.error('Google Sheet Update Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function createSpreadsheet(
  config: SheetConfig,
  title: string,
  personalEmail?: string
) {
  try {
    const serviceAccountAuth = new JWT({
      email: config.clientEmail,
      key: config.privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    console.log('Creating spreadsheet with title via Drive API:', title);

    const { google } = await import('googleapis');
    const drive = google.drive({ version: 'v3', auth: serviceAccountAuth });

    try {
      const about = await drive.about.get({ fields: 'storageQuota' });
      console.log('Service Account Storage Quota:', about.data.storageQuota);
    } catch (qErr) {
      console.error('Could not check quota:', qErr);
    }

    const fileMetadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: config.folderId ? [config.folderId] : undefined,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    if (!file.data.id) {
      throw new Error('Failed to create file via Drive API (no ID returned).');
    }

    console.log('Spreadsheet created via Drive API, ID:', file.data.id);

    // Load the doc using the new ID
    const doc = new GoogleSpreadsheet(file.data.id, serviceAccountAuth);
    await doc.loadInfo();

    // 2. Share if personal email provided
    if (personalEmail) {
      try {
        await drive.permissions.create({
          fileId: doc.spreadsheetId,
          requestBody: {
            role: 'writer', // Editor
            type: 'user',
            emailAddress: personalEmail,
          },
          sendNotificationEmail: true, // Notify the user!
        });
        console.log(`Shared sheet ${doc.spreadsheetId} with ${personalEmail}`);
      } catch (shareError: unknown) {
        console.error('Error sharing sheet:', (shareError as Error).message);
      }
    }

    // 3. Initialize headers
    const sheet = doc.sheetsByIndex[0];
    // Standard headers for our form
    await sheet.setHeaderRow(['id', 'createdAt']); // We can add form fields later dynamically, or start with basics

    return {
      success: true,
      spreadsheetId: doc.spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${doc.spreadsheetId}`,
    };
  } catch (error: unknown) {
    console.error('Create Sheet Error Detailed:', error);

    const errorMessage = (error as Error).message || '';
    if (
      errorMessage.includes('quota') ||
      errorMessage.includes('limit') ||
      (
        error as unknown as { response?: { data?: { error?: { message?: string } } } }
      ).response?.data?.error?.message?.includes('quota')
    ) {
      return {
        success: false,
        error:
          'Service Account Storage Quota Exceeded (Limit 0). Please create the Google Sheet manually and paste the URL here.',
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).response) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error('Response Data:', JSON.stringify((error as any).response.data, null, 2));
    }
    return { success: false, error: (error as Error).message };
  }
}


/**
 * Read all rows from the first sheet as plain objects keyed by column header.
 * Read-only — used by the response-summary (charts) feature. Service-account
 * path uses the `spreadsheets.readonly` scope.
 */
export async function readSheetRows(
  config: SheetConfig
): Promise<{ success: boolean; headers?: string[]; rows?: Record<string, string>[]; error?: string }> {
  try {
    let auth;
    if (config.accessToken) {
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: config.accessToken });
      auth = oauth2Client;
    } else if (config.clientEmail && config.privateKey) {
      auth = new JWT({
        email: config.clientEmail,
        key: config.privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else {
      throw new Error('Missing credentials (either Access Token or Service Account)');
    }

    const doc = new GoogleSpreadsheet(config.sheetId, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    const rawRows = await sheet.getRows();
    const rows = rawRows.map((r) => {
      const obj: Record<string, string> = {};
      for (const h of headers) obj[h] = (r.get(h) ?? '').toString();
      return obj;
    });
    return { success: true, headers, rows };
  } catch (error) {
    console.error('Google Sheet Read Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

export interface DailyAttendanceSheetSyncParams {
  config: SheetConfig;
  dayNumber: number;
  totalDays: number;
  participantName?: string;
  identifierLabel?: string;
  identifierValue: string;
  checkInTime?: string;
  checkOutTime?: string;
  durationHours?: number;
  statusText?: string;
  submissionId?: string;
  masterSummary?: {
    formattedTotalTime?: string;
    totalDecimalHours?: number;
    statusText?: string;
  };
}

/**
 * Sync Day 2+ attendance to a dedicated daily worksheet tab (e.g. "Hari 2", "Hari 3")
 * in Google Spreadsheet, preventing the main sheet from being cluttered with endless columns.
 * Also updates summary columns on the master sheet (Sheet 0).
 */
export async function syncDailyAttendanceToSheet(
  params: DailyAttendanceSheetSyncParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      config,
      dayNumber,
      participantName,
      identifierLabel,
      identifierValue,
      checkInTime,
      checkOutTime,
      durationHours,
      statusText,
      submissionId,
      masterSummary,
    } = params;

    const auth = await getGoogleSheetsAuth(config);
    const doc = new GoogleSpreadsheet(config.sheetId, auth);
    await doc.loadInfo();

    const targetTabTitle = `Hari ${dayNumber}`;
    // Case-insensitive lookup for existing sheet
    let daySheet = Object.values(doc.sheetsByTitle).find(
      (s) => s.title.trim().toLowerCase() === targetTabTitle.toLowerCase()
    );

    const defaultHeaders = [
      'Timestamp',
      'Nama',
      identifierLabel || 'No. IC',
      'Masa Masuk',
      'Masa Keluar',
      'Jumlah Jam (Hours)',
      'Status Kehadiran',
    ];

    if (!daySheet) {
      daySheet = await doc.addSheet({
        title: targetTabTitle,
        headerValues: defaultHeaders,
      });
    }

    await daySheet.loadHeaderRow();
    let headers = daySheet.headerValues;
    if (!headers || headers.length === 0) {
      const sanitizedDefault = sanitizeHeaders(defaultHeaders);
      await ensureSheetCapacity(daySheet, sanitizedDefault.length);
      await daySheet.setHeaderRow(sanitizedDefault);
      await daySheet.loadHeaderRow();
      headers = daySheet.headerValues;
    }


    const cleanIdentifier = identifierValue.replace(/[\s\-_/]/g, '').toLowerCase();
    const idHeaderCandidates = [
      identifierLabel,
      'No. IC',
      'No IC',
      'IC',
      'No. Kad Pengenalan',
      'Kad Pengenalan',
      'Email',
      'Emel',
    ].filter(Boolean) as string[];

    const dayRows = await daySheet.getRows();
    const matchedDayRow = dayRows.find((r) => {
      for (const candidate of idHeaderCandidates) {
        const cell = r.get(candidate);
        if (cell) {
          const cleanCell = String(cell).replace(/[\s\-_/]/g, '').toLowerCase();
          if (cleanCell === cleanIdentifier) return true;
        }
      }
      return false;
    });

    if (matchedDayRow) {
      if (checkInTime) matchedDayRow.set('Masa Masuk', sanitizeSheetValue(checkInTime));
      if (checkOutTime) matchedDayRow.set('Masa Keluar', sanitizeSheetValue(checkOutTime));
      if (durationHours !== undefined) {
        matchedDayRow.set('Jumlah Jam (Hours)', durationHours);
      }
      if (statusText) matchedDayRow.set('Status Kehadiran', sanitizeSheetValue(statusText));
      await matchedDayRow.save();
    } else {
      const idKey =
        headers.find((h) =>
          idHeaderCandidates.some((c) => c.toLowerCase() === h.trim().toLowerCase())
        ) ||
        identifierLabel ||
        'No. IC';

      await daySheet.addRow({
        Timestamp: sanitizeSheetValue(checkInTime || new Date().toISOString()),
        Nama: sanitizeSheetValue(participantName || ''),
        [idKey]: sanitizeSheetValue(identifierValue),
        'Masa Masuk': sanitizeSheetValue(checkInTime || '-'),
        'Masa Keluar': sanitizeSheetValue(checkOutTime || '-'),
        'Jumlah Jam (Hours)': durationHours ?? 0,
        'Status Kehadiran': sanitizeSheetValue(statusText || `Daftar Masuk (Hari ${dayNumber})`),
      });
    }

    // Update Master Sheet (Sheet 0) with high-level summary only
    const masterSheet = doc.sheetsByIndex[0];
    if (masterSheet && masterSummary) {
      try {
        await masterSheet.loadHeaderRow();
        const mHeaders = masterSheet.headerValues;

        const summaryUpdates: Record<string, string | number> = {};
        if (masterSummary.statusText) {
          summaryUpdates['Status Kehadiran'] = masterSummary.statusText;
        }
        if (masterSummary.formattedTotalTime) {
          summaryUpdates['Jumlah Masa Hadir'] = masterSummary.formattedTotalTime;
        }
        if (masterSummary.totalDecimalHours !== undefined) {
          summaryUpdates['Jumlah Jam Keseluruhan (Total Hours)'] =
            masterSummary.totalDecimalHours;
        }

        if (Object.keys(summaryUpdates).length > 0) {
          const missingMasterHeaders = Object.keys(summaryUpdates).filter(
            (k) => !mHeaders.includes(k)
          );
          if (missingMasterHeaders.length > 0) {
            const updatedMasterHeaders = sanitizeHeaders([...mHeaders, ...missingMasterHeaders]);
            await ensureSheetCapacity(masterSheet, updatedMasterHeaders.length);
            await masterSheet.setHeaderRow(updatedMasterHeaders);
            await masterSheet.loadHeaderRow();
          }

          const masterRows = await masterSheet.getRows();
          const masterRow = masterRows.find((r) => {
            if (submissionId) {
              const sId = r.get('_submission_id');
              if (sId && String(sId) === submissionId) return true;
            }
            for (const candidate of idHeaderCandidates) {
              const cell = r.get(candidate);
              if (cell) {
                const cleanCell = String(cell).replace(/[\s\-_/]/g, '').toLowerCase();
                if (cleanCell === cleanIdentifier) return true;
              }
            }
            return false;
          });

          if (masterRow) {
            for (const [k, v] of Object.entries(summaryUpdates)) {
              masterRow.set(k, sanitizeSheetValue(v));
            }
            await masterRow.save();
          }
        }
      } catch (masterErr) {
        console.warn('[syncDailyAttendanceToSheet] Master sheet update error:', masterErr);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[syncDailyAttendanceToSheet] Error:', error);
    return { success: false, error: (error as Error).message };
  }
}
