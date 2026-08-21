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
    time_1: '07:00',
    time_2: '16:00',
    time_3: '22:00',
    morning_time: '07:00',
    evening_time: '22:00',
    auto_sync_enabled: true,
    auto_sync_on_save: true,
    last_sync_timestamp: '',
    selected_courses: [
      'AGM4367',
      'EEI4267',
      'EEI4360',
      'EEI4361',
      'EEI4362',
      'EER4189',
      'BSE',
    ],
    discovered_courses: [
      { code: 'AGM4367', title: 'Economics and Marketing for Engineering', url: 'https://oulms.ou.ac.lk/course/view.php?id=AGM4367' },
      { code: 'EEI4267', title: 'Requirement Engineering', url: 'https://oulms.ou.ac.lk/course/view.php?id=EEI4267' },
      { code: 'EEI4360', title: 'Introduction to Artificial Intelligence', url: 'https://oulms.ou.ac.lk/course/view.php?id=EEI4360' },
      { code: 'EEI4361', title: 'User Experience Engineering', url: 'https://oulms.ou.ac.lk/course/view.php?id=EEI4361' },
      { code: 'EEI4362', title: 'Object Oriented Design', url: 'https://oulms.ou.ac.lk/course/view.php?id=EEI4362' },
      { code: 'EER4189', title: 'Software Design in Group', url: 'https://oulms.ou.ac.lk/course/view.php?id=EER4189' },
      { code: 'BSE', title: 'BSE Learner Support 2024/2025', url: 'https://oulms.ou.ac.lk/course/view.php?id=BSE' },
    ],
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
