import { NextResponse } from 'next/server';
import { getLMSData, getSettings } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = getLMSData();
  const settings = getSettings();
  return NextResponse.json({
    data,
    settings,
  });
}
