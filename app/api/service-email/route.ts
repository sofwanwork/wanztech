import { getSettings } from '@/lib/storage/settings';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await getSettings();
    if (settings?.googleClientEmail) {
      return NextResponse.json({ email: settings.googleClientEmail });
    } else {
      return NextResponse.json({ error: 'Not configured' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
