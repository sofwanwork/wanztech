import { google } from 'googleapis';
import { getSettings } from '@/lib/storage/settings';

// Helper to format private key (handle escaped newlines)
function formatPrivateKey(key: string): string {
  let clean = key.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1);
  if (clean.includes('\\n')) clean = clean.replace(/\\n/g, '\n');
  return clean;
}

export async function uploadToDrive(file: File, folderId?: string) {
  try {
    const settings = await getSettings();
    if (!settings) {
      throw new Error('Settings not found');
    }

    let auth;

    // Check for OAuth first
    if (settings.googleAccessToken) {
      // We should really handle token refresh here too, but for now assuming valid or relying on upper layer to refresh?
      // Actually, uploadToDrive is usually called from actions/forms.ts right before appendToSheet.
      // If we handle refresh in actions/forms.ts (which we plan to), we can pass the VALID token here?
      // But uploadToDrive currently fetches settings internally.
      // We should PROBABLY allow passing settings or token optionally, or refreshing here.
      // Let's implement basic check and usage here. Ideally we should centralize the "get valid token" logic.
      // But for now:
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: settings.googleAccessToken });
      auth = oauth2Client;
    }
    // Fallback to Service Account
    else if (settings.googleClientEmail && settings.googlePrivateKey) {
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: settings.googleClientEmail,
          private_key: formatPrivateKey(settings.googlePrivateKey),
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
    } else {
      throw new Error('Google Integration not configured');
    }


    const drive = google.drive({ version: 'v3', auth });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Convert buffer to stream
    const { Readable } = await import('stream');
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, webViewLink, webContentLink',
    });

    // Make the file public (reader) - Optional, but good for viewing
    // Or we can rely on the service account owning it.
    // Typically users want to see it, so let's try to make it readable by anyone with link if needed
    // But for safety, let's just return the link. The admin (service account) can always see it.
    // If the user wants to see it, they should share the folder with themselves.

    return {
      id: response.data.id,
      viewLink: response.data.webViewLink,
      downloadLink: response.data.webContentLink,
    };
  } catch (error) {
    console.error('Google Drive Upload Error:', error);
    throw error;
  }
}
