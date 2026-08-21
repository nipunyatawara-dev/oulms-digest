import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getSettings, saveSettings } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const scriptPath = path.join(process.cwd(), 'crawler.py');
  const venvPython = path.join(process.cwd(), '.venv', 'bin', 'python');

  const settings = getSettings();
  const username = req.nextUrl.searchParams.get('username') || settings?.ousl_username || process.env.OUSL_USERNAME;
  const password = req.nextUrl.searchParams.get('password') || settings?.ousl_password || process.env.OUSL_PASSWORD;

  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: 'OUSL Username and Password must be provided.' },
      { status: 400 }
    );
  }

  const hasLocalPython = fs.existsSync(venvPython) || (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && fs.existsSync(scriptPath));

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      if (!hasLocalPython && !fs.existsSync(venvPython)) {
        sendEvent({
          type: 'start',
          progress: 5,
          message: 'Checking execution environment...',
        });

        sendEvent({
          type: 'error',
          success: false,
          message: 'Local browser automation is unavailable in serverless mode. Please run locally or configure scheduled GitHub Actions.',
        });

        controller.close();
        return;
      }

      const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

      try {
        const env: NodeJS.ProcessEnv = {
          ...process.env,
          OUSL_USERNAME: username,
          OUSL_PASSWORD: password,
        };

        const proc = spawn(pythonCmd, [scriptPath, '--discover', '--username', username, '--password', password], {
          cwd: process.cwd(),
          env,
        });

        sendEvent({
          type: 'start',
          progress: 10,
          message: 'Connecting to OUSL IAM Keycloak server...',
        });

        let jsonBuffer = '';

        proc.stdout.on('data', (data) => {
          const text = data.toString();
          jsonBuffer += text;
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
          console.error('Discover crawler stderr:', data.toString());
        });

        proc.on('close', (code) => {
          if (code === 0) {
            const freshSettings = getSettings();
            sendEvent({
              type: 'done',
              success: true,
              progress: 100,
              message: `Course discovery finished successfully! Found ${freshSettings.discovered_courses?.length || 0} courses.`,
              settings: freshSettings,
              courses: freshSettings.discovered_courses || [],
            });
          } else {
            sendEvent({
              type: 'error',
              success: false,
              message: `Discovery process exited with code ${code}. Please verify your OUSL login credentials.`,
            });
          }
          controller.close();
        });

        proc.on('error', (err) => {
          sendEvent({
            type: 'error',
            success: false,
            message: `Failed to launch course discovery: ${err.message}`,
          });
          controller.close();
        });
      } catch (err) {
        sendEvent({
          type: 'error',
          success: false,
          message: `Course discovery error: ${err instanceof Error ? err.message : String(err)}`,
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (username || password) {
      saveSettings({
        ousl_username: username,
        ousl_password: password,
      });
    }

    return NextResponse.json({ success: true, message: 'Credentials saved for discovery.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 });
  }
}
