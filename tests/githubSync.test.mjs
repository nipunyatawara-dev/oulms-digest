import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/githubSync.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { dispatchCloudSync, getCloudSyncStatus } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const repo = 'owner/digest';
const runId = '1234';
const run = { path: '.github/workflows/lms_check.yml', head_branch: 'main', status: 'completed', conclusion: 'success', updated_at: new Date().toISOString() };
const digest = { success: true, github_run_id: runId, stats: { total_courses: 8 } };
const mock = (responses) => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    assert.ok(responses.length, 'Unexpected GitHub request');
    const response = responses.shift();
    return new Response(JSON.stringify(response.body ?? response), { status: response.httpStatus ?? 200 });
  };
  return calls;
};

test('dispatch returns a queued run ID, never completed data', async () => {
  const calls = mock([{ workflow_run_id: 1234 }]);
  const result = await dispatchCloudSync(repo, 'fake-test-token', ['BSE', 'EEI4360']);
  assert.equal(result.type, 'queued');
  assert.equal(result.runId, runId);
  assert.ok(result.progress < 100);
  assert.equal(calls[0].options.headers['X-GitHub-Api-Version'], '2026-03-10');
  assert.deepEqual(JSON.parse(calls[0].options.body).inputs, { selected_courses: 'BSE,EEI4360' });
});

test('accepted dispatch without tracking ID does not claim completion', async () => {
  mock([{}]);
  await assert.rejects(dispatchCloudSync(repo, 'fake'), /accepted.*did not return its run ID/);
});

test('queued and preparing states stay below 100', async () => {
  mock([{ ...run, status: 'queued', conclusion: null }]);
  assert.equal((await getCloudSyncStatus(repo, 'fake', runId, digest)).progress, 10);
  mock([{ ...run, status: 'in_progress', conclusion: null }, { jobs: [] }]);
  assert.equal((await getCloudSyncStatus(repo, 'fake', runId, digest)).progress, 25);
});

test('running crawler and data commit have distinct progress', async () => {
  mock([{ ...run, status: 'in_progress' }, { jobs: [{ steps: [{ name: 'Run Crawler', status: 'in_progress' }] }] }]);
  assert.equal((await getCloudSyncStatus(repo, 'fake', runId, null)).progress, 50);
  mock([{ ...run, status: 'in_progress' }, { jobs: [{ steps: [{ name: 'Run Crawler', status: 'completed' }] }] }]);
  assert.equal((await getCloudSyncStatus(repo, 'fake', runId, null)).progress, 85);
});

test('successful workflow waits for its own deployed digest', async () => {
  for (const data of [null, { ...digest, github_run_id: '9999' }, { ...digest, github_run_id: undefined }]) {
    mock([run]);
    const result = await getCloudSyncStatus(repo, 'fake', runId, data);
    assert.equal(result.type, 'progress');
    assert.equal(result.progress, 95);
  }
});

test('only success plus matching published data reaches 100 with actual course count', async () => {
  mock([run]);
  const result = await getCloudSyncStatus(repo, 'fake', runId, digest);
  assert.equal(result.type, 'done');
  assert.equal(result.progress, 100);
  assert.match(result.message, /8 courses/);
});

test('failed, cancelled and timed out workflows never report success', async () => {
  for (const conclusion of ['failure', 'cancelled', 'timed_out']) {
    mock([{ ...run, conclusion }]);
    assert.equal((await getCloudSyncStatus(repo, 'fake', runId, digest)).type, 'error');
  }
});

test('stalled deployment gives actionable status, not a false success', async () => {
  mock([{ ...run, updated_at: new Date(Date.now() - 16 * 60 * 1000).toISOString() }]);
  const result = await getCloudSyncStatus(repo, 'fake', runId, null);
  assert.equal(result.type, 'error');
  assert.match(result.message, /crawl succeeded.*deployment/);
});

test('API failures, unrelated workflows and invalid IDs cannot be mistaken for success', async () => {
  mock([{ httpStatus: 403, body: {} }]);
  await assert.rejects(getCloudSyncStatus(repo, 'fake', runId, null), /HTTP 403/);
  mock([{ ...run, path: '.github/workflows/other.yml' }]);
  await assert.rejects(getCloudSyncStatus(repo, 'fake', runId, digest), /does not belong/);
  mock([]);
  await assert.rejects(getCloudSyncStatus(repo, 'fake', '../secrets', digest), /Invalid/);
});
