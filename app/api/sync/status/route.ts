import { NextRequest, NextResponse } from 'next/server';
import { getClientSettings, getLMSData, getSettings } from '@/lib/dataStore';
import { getCloudSyncStatus } from '@/lib/githubSync';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get('runId') || '';
  if (!/^\d+$/.test(runId)) return NextResponse.json({ error: 'Invalid run ID.' }, { status: 400 });
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) return NextResponse.json({ error: 'GitHub token is not configured.' }, { status: 503 });
  const repo = process.env.GITHUB_REPOSITORY || getSettings().github_repo || 'nipunyatawara-dev/oulms-digest';
  try {
    const data = getLMSData();
    const status = await getCloudSyncStatus(repo, token, runId, data);
    return NextResponse.json({
      ...status,
      ...(status.type === 'done' ? { data, settings: getClientSettings() } : {}),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to check the crawl status.' }, { status: 502 });
  }
}
