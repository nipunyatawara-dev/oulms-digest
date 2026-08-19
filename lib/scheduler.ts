import { getSettings } from './dataStore';
import { spawn } from 'child_process';
import path from 'path';

let schedulerInterval: NodeJS.Timeout | null = null;
let lastTriggeredMinute = '';

export function initScheduler() {
  if (schedulerInterval) {
    return;
  }

  console.log('[+] In-App Scheduler initialized. Checking time every 30 seconds...');

  schedulerInterval = setInterval(async () => {
    try {
      const settings = getSettings();
      if (!settings || !settings.auto_sync_enabled) {
        return;
      }

      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      if (currentTime === lastTriggeredMinute) {
        return; // Already triggered in this minute
      }

      const times = [
        settings.time_1 || '07:00',
        settings.time_2 || '16:00',
        settings.time_3 || '22:00',
        settings.morning_time,
        settings.evening_time
      ].filter(Boolean);

      if (times.includes(currentTime)) {
        lastTriggeredMinute = currentTime;
        console.log(`[⏰ Scheduler] Triggering automatic sync at ${currentTime}...`);
        
        const rootDir = process.cwd();
        const pythonScript = path.join(rootDir, 'crawler.py');
        const venvPython = path.join(rootDir, '.venv', 'bin', 'python');
        const pyExec = process.env.NODE_ENV === 'production' ? 'python' : venvPython;

        const child = spawn(pyExec, [pythonScript], {
          cwd: rootDir,
          env: process.env,
        });

        child.stdout.on('data', (data) => {
          console.log(`[Crawler STDOUT] ${data.toString().trim()}`);
        });

        child.stderr.on('data', (data) => {
          console.error(`[Crawler STDERR] ${data.toString().trim()}`);
        });

        child.on('close', (code) => {
          console.log(`[Crawler Process] Completed with code ${code}`);
        });
      }
    } catch (err) {
      console.error('[!] Error in scheduler loop:', err);
    }
  }, 30000);
}
