
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
    data: Record<string, string | number | boolean>
) {
    try {
        const serviceAccountAuth = new JWT({
            email: config.clientEmail,
            key: config.privateKey,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
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
            console.log("Header load failed (expected for new sheet):", e);
        }

        // If sheet is new/empty, headerValues might be empty array
        if (!headers || headers.length === 0) {
            console.log("Setting new headers...");
            // Create headers from the keys
            const newHeaders = Object.keys(data);
            await sheet.setHeaderRow(newHeaders);

            // Reload headers to be safe
            await sheet.loadHeaderRow();
        }

        await sheet.addRow(data);
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
                'https://www.googleapis.com/auth/drive'
            ],
        });

        console.log("Creating spreadsheet with title via Drive API:", title);

        const { google } = require('googleapis');
        const drive = google.drive({ version: 'v3', auth: serviceAccountAuth });

        try {
            const about = await drive.about.get({ fields: 'storageQuota' });
            console.log("Service Account Storage Quota:", about.data.storageQuota);
        } catch (qErr) {
            console.error("Could not check quota:", qErr);
        }

        const fileMetadata: any = {
            name: title,
            mimeType: 'application/vnd.google-apps.spreadsheet',
        };

        if (config.folderId) {
            fileMetadata.parents = [config.folderId];
        }

        const file = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });

        if (!file.data.id) {
            throw new Error('Failed to create file via Drive API (no ID returned).');
        }

        console.log("Spreadsheet created via Drive API, ID:", file.data.id);

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
                        emailAddress: personalEmail
                    },
                    sendNotificationEmail: true // Notify the user!
                });
                console.log(`Shared sheet ${doc.spreadsheetId} with ${personalEmail}`);

            } catch (shareError: any) {
                console.error("Error sharing sheet:", shareError.message);
            }
        }

        // 3. Initialize headers
        const sheet = doc.sheetsByIndex[0];
        // Standard headers for our form
        await sheet.setHeaderRow(['id', 'createdAt']); // We can add form fields later dynamically, or start with basics

        return {
            success: true,
            spreadsheetId: doc.spreadsheetId,
            url: `https://docs.google.com/spreadsheets/d/${doc.spreadsheetId}`
        };

    } catch (error: any) {
        console.error('Create Sheet Error Detailed:', error);

        const errorMessage = error.message || '';
        if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
            return {
                success: false,
                error: "Service Account Storage Quota Exceeded (Limit 0). Please create the Google Sheet manually and paste the URL here."
            };
        }

        if (error.response) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        return { success: false, error: (error as Error).message };
    }
}
