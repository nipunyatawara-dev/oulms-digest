import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = saveSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
