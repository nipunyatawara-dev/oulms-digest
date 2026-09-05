import type { LMSDataPayload } from './types';

const API_VERSION = '2026-03-10';
const WORKFLOW = '.github/workflows/lms_check.yml';

export interface CloudSyncStatus {
  type: 'progress' | 'done' | 'error';
  progress: number;
  message: string;
  runId: string;
  runUrl: string;
}

async function githubRequest(repo: string, token: string, endpoint: string, body?: unknown) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Invalid GitHub repository configuration.');
  const response = await fetch(`https://api.github.com/repos/${repo}/${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}. Check the configured token's Actions permissions.`);
  return response;
}

export async function dispatchCloudSync(repo: string, token: string, courses?: string[]) {
  const response = await githubRequest(repo, token, 'actions/workflows/lms_check.yml/dispatches', {
    ref: 'main',
    ...(courses?.length ? { inputs: { selected_courses: courses.join(',') } } : {}),
  });
  // This API version returns the exact run ID; never guess from the latest run.
  const result = response.status === 204 ? {} : await response.json();
  if (!result.workflow_run_id) {
    throw new Error('GitHub accepted the crawl but did not return its run ID. Check GitHub Actions before starting another sync.');
  }
  return {
    type: 'queued' as const,
    progress: 10,
    runId: String(result.workflow_run_id),
    runUrl: `https://github.com/${repo}/actions/runs/${result.workflow_run_id}`,
    message: 'Crawl queued. Waiting for a runner...',
  };
}

export async function getCloudSyncStatus(repo: string, token: string, runId: string, data: LMSDataPayload | null): Promise<CloudSyncStatus> {
  if (!/^\d+$/.test(runId)) throw new Error('Invalid workflow run ID.');
  const response = await githubRequest(repo, token, `actions/runs/${runId}`);
  const run = await response.json();
  if (run.path !== WORKFLOW || run.head_branch !== 'main') throw new Error('This run does not belong to the LMS sync workflow on main.');
  const base = { runId, runUrl: `https://github.com/${repo}/actions/runs/${runId}` };
  if (run.status === 'completed') {
    if (run.conclusion !== 'success') {
      return { ...base, type: 'error', progress: 0, message: `The crawl ${run.conclusion === 'cancelled' ? 'was cancelled' : `ended with ${run.conclusion || 'an unknown result'}`}. Your last successful digest is still available. Check the run details.` };
    }
    if (data?.github_run_id === runId && data.success && String(data.github_run_attempt || '1') === String(run.run_attempt || 1)) {
      return { ...base, type: 'done', progress: 100, message: `Sync complete. ${data.stats.total_courses} courses updated and available on this site.` };
    }
    if (Date.now() - Date.parse(run.updated_at) > 15 * 60 * 1000) {
      return { ...base, type: 'error', progress: 95, message: 'The crawl succeeded, but its updated data has not appeared on this site after 15 minutes. Check the site deployment before starting another crawl.' };
    }
    return { ...base, type: 'progress', progress: 95, message: 'Crawl succeeded. Waiting for the site to publish the updated digest...' };
  }
  if (run.status !== 'in_progress') {
    return { ...base, type: 'progress', progress: 10, message: 'Crawl queued. Waiting for a runner...' };
  }
  const jobsResponse = await githubRequest(repo, token, `actions/runs/${runId}/jobs`);
  const { jobs = [] } = await jobsResponse.json();
  const steps = jobs.flatMap((job: { steps?: { name: string; status: string }[] }) => job.steps || []);
  const current = steps.find((step: { status: string }) => step.status === 'in_progress');
  if (current?.name === 'Run Crawler') {
    return { ...base, type: 'progress', progress: 50, message: 'Crawler is running. Checking course content and announcements...' };
  }
  if (steps.some((step: { name: string; status: string }) => step.name === 'Run Crawler' && step.status === 'completed')) {
    return { ...base, type: 'progress', progress: 85, message: 'Crawl finished. Saving the digest and seen-post history...' };
  }
  return { ...base, type: 'progress', progress: 25, message: 'Preparing the crawler and browser...' };
}
