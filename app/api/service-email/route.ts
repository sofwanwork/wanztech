import { getSettings } from '@/lib/storage/settings';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Security: Require authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
