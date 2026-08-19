import { getSettings } from './dataStore';
import { spawn } from 'child_process';
import path from 'path';

let isSchedulerRunning = false;
let lastTriggeredMinute = '';

export function initScheduler() {
  if (isSchedulerRunning) return;
  isSchedulerRunning = true;
  console.log('[+] In-App Scheduler initialized. Checking time every 30 seconds...');

  setInterval(() => {
    try {
      const settings = getSettings();
      if (!settings.auto_sync_enabled) return;

      const now = new Date();
      // Format current HH:MM (in 24h format e.g. "07:30", "19:30")
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentHM = `${hours}:${minutes}`;

      // Prevent duplicate trigger in the same minute
      if (currentHM === lastTriggeredMinute) return;

      if (currentHM === settings.morning_time || currentHM === settings.evening_time) {
        console.log(`[⏰ Scheduler Triggered] Scheduled time reached: ${currentHM}`);
        lastTriggeredMinute = currentHM;
        triggerBackgroundCrawler();
      }
    } catch (e) {
      console.error('[!] Scheduler error:', e);
    }
  }, 30000);
}

function triggerBackgroundCrawler() {
  const scriptPath = path.join(process.cwd(), 'crawler.py');
  const venvPython = path.join(process.cwd(), '.venv', 'bin', 'python');
  const fs = require('fs');
  const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

  console.log(`[*] Executing scheduled crawler: ${pythonCmd} ${scriptPath}`);
  const proc = spawn(pythonCmd, [scriptPath], {
    cwd: process.cwd(),
    env: { ...process.env },
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();
}
