import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getLMSData, getSettings } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const scriptPath = path.join(process.cwd(), 'crawler.py');
  const venvPython = path.join(process.cwd(), '.venv', 'bin', 'python');
  const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

  const stream = new ReadableStream({
    start(controller) {
      const proc = spawn(pythonCmd, [scriptPath], {
        cwd: process.cwd(),
        env: { ...process.env },
      });

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'start', progress: 5, message: 'Initializing crawler session...' })}\n\n`)
      );

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          const match = line.match(/\[PROGRESS:(\d+)\]\s*(.*)/);
          if (match) {
            const progress = parseInt(match[1], 10);
            const message = match[2].trim();
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'progress', progress, message })}\n\n`)
            );
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
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', success: true, progress: 100, message: 'Sync finished successfully!', data: freshData, settings })}\n\n`)
          );
        } else {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', success: false, message: `Process exited with code ${code}` })}\n\n`)
          );
        }
        controller.close();
      });

      proc.on('error', (err) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', success: false, message: String(err) })}\n\n`)
        );
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST() {
  return new Promise<NextResponse>((resolve) => {
    const scriptPath = path.join(process.cwd(), 'crawler.py');
    const venvPython = path.join(process.cwd(), '.venv', 'bin', 'python');
    const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

    const proc = spawn(pythonCmd, [scriptPath], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(NextResponse.json({ success: true, data: getLMSData(), settings: getSettings() }));
      } else {
        resolve(NextResponse.json({ success: false, error: `Crawler exited with code ${code}` }, { status: 500 }));
      }
    });

    proc.on('error', (err) => {
      resolve(NextResponse.json({ success: false, error: String(err) }, { status: 500 }));
    });
  });
}
