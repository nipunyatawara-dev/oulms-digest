import fs from 'fs';
import path from 'path';

export function resolveProjectPython(rootDir = process.cwd()) {
  const venvPython = path.join(rootDir, '.venv', 'bin', 'python');
  return fs.existsSync(venvPython) ? venvPython : 'python3';
}

export function explainPythonFailure(stderr: string, code: number | null, task = 'Crawler') {
  const output = stderr.trim();

  if (/No module named ['"]playwright['"]/.test(output)) {
    return 'Local Playwright is not installed. Run `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/playwright install chromium`, then retry Sync Now.';
  }

  if (/Executable doesn't exist|playwright install/i.test(output)) {
    return 'The Playwright Chromium browser is not installed. Run `.venv/bin/playwright install chromium`, then retry Sync Now.';
  }

  const usefulLines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-3)
    .join(' · ')
    .slice(0, 700);

  return usefulLines
    ? `${task} exited with code ${code ?? 'unknown'}: ${usefulLines}`
    : `${task} exited with code ${code ?? 'unknown'}. Check the terminal running Next.js for details.`;
}
