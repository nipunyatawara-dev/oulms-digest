import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getLMSData, getSettings } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

const DEFAULT_REPO = 'nipunyatawara-dev/oulms-digest';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const scriptPath = path.join(process.cwd(), 'crawler.py');
  const venvPython = path.join(process.cwd(), '.venv', 'bin', 'python');
  
  const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const githubRepo = process.env.GITHUB_REPOSITORY || DEFAULT_REPO;

  // Determine if we should attempt local Python execution
  const hasLocalPython = fs.existsSync(venvPython) || (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME);

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
          sendEvent({
            type: 'progress',
            progress: 30,
            message: `Dispatching crawler workflow on ${githubRepo}...`,
          });

          const res = await fetch(
            `https://api.github.com/repos/${githubRepo}/actions/workflows/lms_check.yml/dispatches`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'OUSL-LMS-Digest',
              },
              body: JSON.stringify({ ref: 'main' }),
            }
          );

          if (res.ok || res.status === 204) {
            sendEvent({
              type: 'progress',
              progress: 75,
              message: 'GitHub Actions crawler started! Indexing all 19 courses in the cloud...',
            });

            // Wait a brief moment to confirm dispatch
            await new Promise((r) => setTimeout(r, 1500));

            sendEvent({
              type: 'done',
              success: true,
              progress: 100,
              message: 'Crawl initiated on GitHub Actions. Data will update and auto-deploy upon completion!',
              data: getLMSData(),
              settings: getSettings(),
            });
          } else {
            const errorText = await res.text();
            sendEvent({
              type: 'error',
              success: false,
              message: `GitHub API error (${res.status}): ${errorText || 'Failed to dispatch workflow'}`,
            });
          }
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
      const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

      try {
        const proc = spawn(pythonCmd, [scriptPath], {
          cwd: process.cwd(),
          env: { ...process.env },
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

        proc.stderr.on('data', (data) => {
          console.error('Crawler stderr:', data.toString());
        });

        proc.on('close', (code) => {
          if (code === 0) {
            const freshData = getLMSData();
            const settings = getSettings();
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
              message: `Crawler process exited with code ${code}`,
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
  const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const githubRepo = process.env.GITHUB_REPOSITORY || DEFAULT_REPO;

  if (githubToken) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${githubRepo}/actions/workflows/lms_check.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'OUSL-LMS-Digest',
          },
          body: JSON.stringify({ ref: 'main' }),
        }
      );

      if (res.ok || res.status === 204) {
        return NextResponse.json({
          success: true,
          message: 'GitHub Actions crawler dispatched successfully',
        });
      }
    } catch (e) {
      console.error('Error dispatching GitHub Actions:', e);
    }
  }

  return NextResponse.json(
    {
      success: false,
      error:
        'Serverless execution requires GITHUB_TOKEN to trigger GitHub Actions. Automated crawls run 3x daily.',
    },
    { status: 400 }
  );
}

