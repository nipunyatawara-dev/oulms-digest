import { NextResponse } from 'next/server';
import { getClientSettings, getLMSData } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = getLMSData();
  const settings = getClientSettings();
  return NextResponse.json({
    data,
    settings,
  });
}
