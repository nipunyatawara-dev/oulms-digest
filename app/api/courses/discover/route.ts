import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getLMSData, getSettings } from '@/lib/dataStore';
import { explainPythonFailure, resolveProjectPython } from '@/lib/pythonRuntime';

export const dynamic = 'force-dynamic';

const DEFAULT_REPO = 'nipunyatawara-dev/oulms-digest';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const rootDir = process.cwd();
  const scriptPath = path.join(rootDir, 'crawler.py');
  const venvPython = path.join(rootDir, '.venv', 'bin', 'python');
  const settings = getSettings();
  const data = getLMSData();
  const knownCourses =
    data?.available_courses ||
    settings.discovered_courses ||
    (data?.courses || []).map((course) => ({ code: course.code, title: course.title, url: course.url }));
  const selectedCourses = req.nextUrl.searchParams.get('courses') || settings.selected_courses?.join(',') || '';
  const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const githubRepo = process.env.GITHUB_REPOSITORY || DEFAULT_REPO;
  const hasLocalPython =
    fs.existsSync(venvPython) ||
    (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && fs.existsSync(scriptPath));

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      if (!hasLocalPython) {
        if (!githubToken) {
          sendEvent({
            type: 'error',
            success: false,
            message: 'Course discovery on Vercel requires GITHUB_TOKEN. Add it in Vercel Project Settings and redeploy.',
          });
          controller.close();
          return;
        }

        sendEvent({ type: 'start', progress: 15, message: 'Starting one-time course discovery through GitHub Actions...' });
        try {
          const response = await fetch(
            `https://api.github.com/repos/${githubRepo}/actions/workflows/lms_check.yml/dispatches`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'OUSL-LMS-Digest',
              },
              body: JSON.stringify({
                ref: 'main',
                ...(selectedCourses ? { inputs: { selected_courses: selectedCourses } } : {}),
              }),
            }
          );

          if (!response.ok && response.status !== 204) {
            throw new Error(`GitHub workflow dispatch failed (${response.status})`);
          }

          sendEvent({
            type: 'done',
            success: true,
            progress: 100,
            message: 'Course discovery started in GitHub Actions. The refreshed catalogue will appear after the Action and Vercel deployment finish.',
            courses: knownCourses,
          });
        } catch (error) {
          sendEvent({
            type: 'error',
            success: false,
            message: error instanceof Error ? error.message : String(error),
          });
        }
        controller.close();
        return;
      }

      const username = process.env.OUSL_USERNAME || '';
      const password = process.env.OUSL_PASSWORD || '';
      if (!username || !password) {
        sendEvent({
          type: 'error',
          success: false,
          message: 'Add OUSL_USERNAME and OUSL_PASSWORD to .env.local, restart npm run dev, then reopen Course Selector.',
        });
        controller.close();
        return;
      }

      const pythonCmd = resolveProjectPython(rootDir);
      const env: NodeJS.ProcessEnv = { ...process.env, OUSL_USERNAME: username, OUSL_PASSWORD: password };
      const proc = spawn(pythonCmd, [scriptPath, '--discover'], { cwd: rootDir, env });
      sendEvent({ type: 'start', progress: 10, message: 'Discovering enrolled OUSL courses...' });

      let stderrBuffer = '';
      proc.stdout.on('data', (chunk) => {
        for (const line of chunk.toString().split('\n')) {
          const match = line.match(/\[PROGRESS:(\d+)\]\s*(.*)/);
          if (match) {
            sendEvent({ type: 'progress', progress: Number(match[1]), message: match[2].trim() });
          }
        }
      });
      proc.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderrBuffer = `${stderrBuffer}${text}`.slice(-6000);
        console.error('Course discovery stderr:', text);
      });
      proc.on('error', (error) => {
        sendEvent({ type: 'error', success: false, message: `Failed to launch course discovery: ${error.message}` });
        controller.close();
      });
      proc.on('close', (code) => {
        if (code === 0) {
          const freshSettings = getSettings();
          sendEvent({
            type: 'done',
            success: true,
            progress: 100,
            message: `Found ${freshSettings.discovered_courses?.length || 0} enrolled courses.`,
            courses: freshSettings.discovered_courses || knownCourses,
          });
        } else {
          sendEvent({
            type: 'error',
            success: false,
            message: explainPythonFailure(stderrBuffer, code, 'Course discovery'),
          });
        }
        controller.close();
      });
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
