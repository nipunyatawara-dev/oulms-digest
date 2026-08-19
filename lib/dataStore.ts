import fs from 'fs';
import path from 'path';
import { LMSDataPayload, UserSettings } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'lms_data.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

export function getLMSData(): LMSDataPayload | null {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading lms_data.json:', error);
    return null;
  }
}

export function getSettings(): UserSettings {
  const defaults: UserSettings = {
    morning_time: '07:30',
    evening_time: '19:30',
    auto_sync_enabled: true,
    last_sync_timestamp: '',
  };

  try {
    if (!fs.existsSync(SETTINGS_FILE)) return defaults;
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...defaults, ...JSON.parse(raw) };
  } catch (error) {
    console.error('Error reading settings.json:', error);
    return defaults;
  }
}

export function saveSettings(settings: Partial<UserSettings>): UserSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving settings.json:', error);
  }
  return updated;
}
