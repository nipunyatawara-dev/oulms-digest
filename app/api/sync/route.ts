import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getClientSettings, getLMSData, getSettings } from '@/lib/dataStore';
import { explainPythonFailure, resolveProjectPython } from '@/lib/pythonRuntime';

import { dispatchCloudSync } from '@/lib/githubSync';

export const dynamic = 'force-dynamic';

const DEFAULT_REPO = 'nipunyatawara-dev/oulms-digest';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const scriptPath = path.join(process.cwd(), 'crawler.py');
  const venvPython = path.join(process.cwd(), '.venv', 'bin', 'python');
  
  const settings = getSettings();
  const requestedCourses = req.nextUrl.searchParams.get('courses')
    ?.split(',')
    .map((code) => code.trim())
    .filter(Boolean);
  const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const githubRepo = process.env.GITHUB_REPOSITORY || settings?.github_repo || DEFAULT_REPO;

  // Determine if we should attempt local Python execution
  const hasLocalPython = fs.existsSync(venvPython) || (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && fs.existsSync(scriptPath));

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // 1. If running on Vercel / Cloud and GITHUB_TOKEN is configured, dispatch GitHub Action
      if (!hasLocalPython && githubToken) {
        sendEvent({
          type: 'start',
          progress: 10,
          message: 'Connecting to GitHub Actions API...',
        });

        try {
          const selectedCourses = requestedCourses?.length ? requestedCourses : settings?.selected_courses;
          sendEvent(await dispatchCloudSync(githubRepo, githubToken, selectedCourses));
        } catch (err) {
          sendEvent({
            type: 'error',
            success: false,
            message: `Failed to trigger GitHub Actions: ${err instanceof Error ? err.message : String(err)}`,
          });
        }

        controller.close();
        return;
      }

      // 2. If running on Vercel / Cloud without GITHUB_TOKEN and without local python
      if (!hasLocalPython && !fs.existsSync(venvPython)) {
        sendEvent({
          type: 'start',
          progress: 5,
          message: 'Checking execution environment...',
        });

        sendEvent({
          type: 'error',
          success: false,
          message:
            'Cloud serverless runtime detected (Vercel). Live headless Playwright scraping is executed automatically 3x daily via GitHub Actions. To enable instant "Sync Now" from Vercel, add a GITHUB_TOKEN in your Vercel Project Settings.',
        });

        controller.close();
        return;
      }

      // 3. Local execution with Python/Playwright
      const localUsername = process.env.OUSL_USERNAME || '';
      const localPassword = process.env.OUSL_PASSWORD || '';
      if (!localUsername || !localPassword) {
        sendEvent({
          type: 'error',
          success: false,
          message: 'OUSL credentials are not configured for local sync. Add OUSL_USERNAME and OUSL_PASSWORD to .env.local, restart npm run dev, then retry.',
        });
        controller.close();
        return;
      }

      const pythonCmd = resolveProjectPython();

      try {
        const env: NodeJS.ProcessEnv = {
          ...process.env,
          OUSL_USERNAME: localUsername,
          OUSL_PASSWORD: localPassword,
        };
        const selectedCourses = requestedCourses?.length ? requestedCourses : settings?.selected_courses;
        if (selectedCourses && selectedCourses.length > 0) {
          env.SELECTED_COURSES = selectedCourses.join(',');
        }

        const proc = spawn(pythonCmd, [scriptPath], {
          cwd: process.cwd(),
          env,
        });

        sendEvent({
          type: 'start',
          progress: 5,
          message: 'Initializing local Playwright crawler session...',
        });

        proc.stdout.on('data', (data) => {
          const text = data.toString();
          const lines = text.split('\n');
          for (const line of lines) {
            const match = line.match(/\[PROGRESS:(\d+)\]\s*(.*)/);
            if (match) {
              const progress = parseInt(match[1], 10);
              const message = match[2].trim();
              sendEvent({ type: 'progress', progress, message });
            }
          }
        });

        let stderrBuffer = '';
        proc.stderr.on('data', (data) => {
          const text = data.toString();
          stderrBuffer = `${stderrBuffer}${text}`.slice(-6000);
          console.error('Crawler stderr:', text);
        });

        proc.on('close', (code) => {
          if (code === 0) {
            const freshData = getLMSData();
            const settings = getClientSettings();
            sendEvent({
              type: 'done',
              success: true,
              progress: 100,
              message: 'Sync finished successfully!',
              data: freshData,
              settings,
            });
          } else {
            sendEvent({
              type: 'error',
              success: false,
              message: explainPythonFailure(stderrBuffer, code),
            });
          }
          controller.close();
        });

        proc.on('error', (err) => {
          sendEvent({
            type: 'error',
            success: false,
            message: `Crawler spawn error: ${err.message}`,
          });
          controller.close();
        });
      } catch (err) {
        sendEvent({
          type: 'error',
          success: false,
          message: `Failed to spawn crawler: ${err instanceof Error ? err.message : String(err)}`,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

export async function POST() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const settings = getSettings();
  const repo = process.env.GITHUB_REPOSITORY || settings.github_repo || DEFAULT_REPO;
  if (!token) return NextResponse.json({ error: 'GitHub token is not configured.' }, { status: 503 });
  try {
    return NextResponse.json(await dispatchCloudSync(repo, token, settings.selected_courses), { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to start the crawl.' }, { status: 502 });
  }
}
