import { getForms } from '@/lib/storage/forms';
import { getSettings } from '@/lib/storage/settings';
import { ResponsesClient } from './client';

export const dynamic = 'force-dynamic';

export default async function ResponsesPage() {
    const [forms, settings] = await Promise.all([getForms(), getSettings()]);

    const hasGoogleOAuth = !!settings?.googleAccessToken;

    return <ResponsesClient forms={forms} hasGoogleOAuth={hasGoogleOAuth} />;
}
