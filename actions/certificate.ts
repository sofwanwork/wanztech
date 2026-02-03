'use server';

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { getFormById, getSettingsByFormId } from '@/lib/storage';

export interface CertificateCheckResult {
  found: boolean;
  name?: string;
  date?: string;
  programName?: string;
  error?: string;
}

function formatPrivateKey(key: string) {
  let clean = key.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
  if (clean.includes('\\n')) clean = clean.replace(/\\n/g, '\n');
  return clean;
}

export async function checkCertificateByIC(
  formId: string,
  ic: string
): Promise<CertificateCheckResult> {
  try {
    // Get form and settings
    const form = await getFormById(formId);
    if (!form) {
      return { found: false, error: 'Form tidak dijumpai' };
    }

    if (!form.eCertificateEnabled) {
      return { found: false, error: 'E-Sijil tidak diaktifkan untuk form ini' };
    }

    if (!form.googleSheetUrl) {
      return { found: false, error: 'Google Sheet tidak dikonfigurasi' };
    }

    const settings = await getSettingsByFormId(formId);
    if (!settings?.googleClientEmail || !settings?.googlePrivateKey) {
      return { found: false, error: 'Credentials Google Sheet tidak lengkap' };
    }

    // Extract sheet ID from URL
    const match = form.googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      return { found: false, error: 'URL Google Sheet tidak sah' };
    }

    const sheetId = match[1];
    const pk = formatPrivateKey(settings.googlePrivateKey);

    // Connect to Google Sheet
    const serviceAccountAuth = new JWT({
      email: settings.googleClientEmail,
      key: pk,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;

    // Find IC column (look for "IC", "No IC", "No Kad Pengenalan", etc.)
    const icColumnIndex = headers.findIndex(
      (h) =>
        h.toLowerCase().includes('ic') ||
        h.toLowerCase().includes('kad pengenalan') ||
        h.toLowerCase() === 'no. ic' ||
        h.toLowerCase() === 'no.ic'
    );

    // Find Name column
    const nameColumnIndex = headers.findIndex(
      (h) =>
        h.toLowerCase().includes('nama') ||
        h.toLowerCase() === 'name' ||
        h.toLowerCase() === 'full name'
    );

    if (icColumnIndex === -1) {
      return { found: false, error: 'Field IC tidak dijumpai dalam Google Sheet' };
    }

    if (nameColumnIndex === -1) {
      return { found: false, error: 'Field Nama tidak dijumpai dalam Google Sheet' };
    }

    // Get all rows and search for IC
    const rows = await sheet.getRows();

    // Clean IC for comparison (remove dashes, spaces)
    const cleanIC = ic.replace(/[-\s]/g, '');

    for (const row of rows) {
      const rowIC = (row.get(headers[icColumnIndex]) || '').toString().replace(/[-\s]/g, '');
      if (rowIC === cleanIC) {
        // Found the participant
        const name = row.get(headers[nameColumnIndex]) || '';

        // Look for date column (optional)
        const dateColumnIndex = headers.findIndex(
          (h) =>
            h.toLowerCase().includes('tarikh') ||
            h.toLowerCase().includes('date') ||
            h.toLowerCase() === 'timestamp'
        );
        const date = dateColumnIndex !== -1 ? row.get(headers[dateColumnIndex]) : undefined;

        return {
          found: true,
          name: name.toString(),
          date: date?.toString(),
          programName: form.title,
        };
      }
    }

    return { found: false, error: 'IC tidak dijumpai dalam rekod' };
  } catch (error) {
    console.error('Certificate check error:', error);
    return { found: false, error: 'Ralat semasa menyemak sijil' };
  }
}

// Get form details for public check page
export async function getFormForCertificateCheck(formId: string) {
  const form = await getFormById(formId);
  if (!form) return null;

  return {
    id: form.id,
    title: form.title,
    eCertificateEnabled: form.eCertificateEnabled,
    eCertificateTemplate: form.eCertificateTemplate,
  };
}
