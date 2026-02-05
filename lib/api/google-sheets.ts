import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export interface SheetConfig {
  sheetId: string;
  clientEmail: string;
  privateKey: string;
  folderId?: string;
}

export async function appendToSheet(
  config: SheetConfig,
  data: Record<string, string | number | boolean | null | undefined>
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

    const doc = new GoogleSpreadsheet(config.sheetId, serviceAccountAuth);

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

    // If sheet is new/empty, headerValues might be empty array
    if (!headers || headers.length === 0) {
      console.log('Setting new headers...');
      // Create headers from the keys
      const newHeaders = Object.keys(data);
      await sheet.setHeaderRow(newHeaders);

      // Reload headers to be safe
      await sheet.loadHeaderRow();
    }

    // Sanitize data: convert null/undefined to empty string to satisfy google-spreadsheet types
    const sanitizedData: Record<string, string | number | boolean> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        sanitizedData[key] = '';
      } else {
        sanitizedData[key] = value;
      }
    });

    await sheet.addRow(sanitizedData);
    return { success: true };
  } catch (error) {
    console.error('Google Sheet Error:', error);
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
