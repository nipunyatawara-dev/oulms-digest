import { NextResponse } from 'next/server';
import { getClientSettings, saveSettings } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = getClientSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const courseAndScheduleSettings = { ...body };
    delete courseAndScheduleSettings.ousl_username;
    delete courseAndScheduleSettings.ousl_password;
    delete courseAndScheduleSettings.github_token;
    saveSettings(courseAndScheduleSettings);
    return NextResponse.json({ success: true, settings: getClientSettings() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
