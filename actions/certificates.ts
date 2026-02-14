'use server';

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { getFormById } from '@/lib/storage/forms';
import { getSettingsByFormId } from '@/lib/storage/settings';

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

    // Helper to parse date (Google Sheets usually sends d/m/yyyy or m/d/yyyy or yyyy-mm-dd)
    const parseDate = (dateStr: string) => {
      if (!dateStr) return null;

      // prioritize DD/MM/YYYY or DD-MM-YYYY which is common in Malaysia
      const parts = dateStr.split(/[/-]/);
      if (parts.length === 3) {
        const p0 = parseInt(parts[0]);
        const p1 = parseInt(parts[1]);
        const p2 = parseInt(parts[2]);

        // Check if it looks like YYYY-MM-DD (ISO)
        if (p0 > 1000) {
          return new Date(`${p0}-${p1}-${p2}`);
        }

        // Check if day is clearly first (> 12)
        if (p0 > 12) {
          return new Date(`${p2}-${p1}-${p0}`); // yyyy-mm-dd
        }

        // AMBIGUOUS CASE: 01/02/2024.
        // Google Sheets API v4 with 'formattedValue' usually respects the sheet's locale.
        // But if we receive "01/02/2024", standard JS Date matches US (Feb 1st).
        // Malaysia expects Jan 2nd.
        // We will FORCE DD/MM/YYYY interpretation for 3-part dates that are not ISO.
        return new Date(`${p2}-${p1}-${p0}`);
      }

      // Fallback for other formats (like "Jan 1, 2024")
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;

      return null;
    };

    // Helper to get Malaysia Time (UTC+8)
    const getMalaysiaDate = (date: Date) => {
      return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    };

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

        // Expiration Check
        if (form.eCertificateExpiryDays && form.eCertificateExpiryDays > 0) {
          if (!date) {
            return { found: false, error: 'Tarikh tidak dijumpai untuk pengesahan tarikh luput' };
          }

          const submissionDate = parseDate(date.toString());

          if (!submissionDate || isNaN(submissionDate.getTime())) {
            console.error(`Date parsing failed for: ${date}`);
            return { found: false, error: 'Format tarikh tidak sah untuk pengesahan' };
          }

          // normalize submission date to start of day in Malaysia time (if it isn't already)
          // actually parseDate returns a Date object.

          const expiryDate = new Date(submissionDate);
          expiryDate.setDate(expiryDate.getDate() + form.eCertificateExpiryDays);

          // Compare against current Malaysia time
          const nowUTC = new Date();
          const nowMYT = getMalaysiaDate(nowUTC);

          // Reset time part to ensure we are comparing dates only (if that is the intention of "days")
          // If we want exact 24h * days, we keep time.
          // Usually "valid for 1 day" means valid until the end of the next day?
          // Let's assume strict 24h * days if time is present, or just date comparison.
          // Since Google Sheet dates might not have time, let's strip time for robust "calendar days" comparison.

          expiryDate.setHours(23, 59, 59, 999); // Expire at end of the target day
          nowMYT.setHours(0, 0, 0, 0); // Compare against start of today? No, Compare now.

          if (nowMYT > expiryDate) {
            return {
              found: false,
              error: form.eCertificateExpiredMessage || 'Pautan sijil ini telah luput',
            };
          }
        }

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
