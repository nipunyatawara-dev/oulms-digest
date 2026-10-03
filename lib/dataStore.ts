import fs from 'fs';
import path from 'path';
import { LMSDataPayload, UserSettings } from './types';
import { categorizeAcademicItem } from './categoryUtils';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'lms_data.json');
const ARCHIVE_FILE = path.join(DATA_DIR, 'archived_courses.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function readJsonFile<T>(filePath: string): Partial<T> {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Partial<T>;
}

export function getLMSData(): LMSDataPayload | null {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed: LMSDataPayload = JSON.parse(raw);

    if (parsed) {
      if (Array.isArray(parsed.notifications)) {
        parsed.notifications = parsed.notifications.map((n) => ({
          ...n,
          category: categorizeAcademicItem(n.title || ''),
        }));
      }

      if (Array.isArray(parsed.courses)) {
        parsed.courses = parsed.courses.map((c) => ({
          ...c,
          updates: (c.updates || []).map((u) => ({
            ...u,
            category: categorizeAcademicItem(u.topic || ''),
          })),
        }));
      }

      if (!Array.isArray(parsed.archived_courses) && fs.existsSync(ARCHIVE_FILE)) {
        try {
          const archiveRaw = fs.readFileSync(ARCHIVE_FILE, 'utf-8');
          parsed.archived_courses = JSON.parse(archiveRaw);
        } catch (e) {
          console.error('Error reading archived_courses.json:', e);
        }
      }

      if (Array.isArray(parsed.archived_courses)) {
        parsed.archived_courses = parsed.archived_courses.map((c) => ({
          ...c,
          updates: (c.updates || []).map((u) => ({
            ...u,
            category: categorizeAcademicItem(u.topic || ''),
          })),
        }));
      }
    }

    return parsed;
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
      'BSE',
      'EER4189',
      'FET2025',
      'EEI4365',
      'MHZ3356',
      'MHZ4377',
    ],
    discovered_courses: [
      { code: 'BSE', title: 'BSE Learner Support 2025-2026', url: 'https://oulms.ou.ac.lk/course/view.php?id=3430' },
      { code: 'EER4189', title: 'EER4189 Software Design in Group', url: 'https://oulms.ou.ac.lk/course/view.php?id=3478' },
      { code: 'FET2025', title: 'FET2025 Common Forum - Faculty of Engineering Technology', url: 'https://oulms.ou.ac.lk/course/view.php?id=3573' },
      { code: 'EEI4365', title: 'EEI4365 Data Structures and Algorithms', url: 'https://oulms.ou.ac.lk/course/view.php?id=3442' },
      { code: 'MHZ3356', title: 'MHZ3356 Mathematics for Computing I', url: 'https://oulms.ou.ac.lk/course/view.php?id=3333' },
      { code: 'MHZ4377', title: 'MHZ4377 Applied Statistics', url: 'https://oulms.ou.ac.lk/course/view.php?id=3259' },
      { code: 'AGM4367', title: 'AGM4367 Economics and Marketing for Engineering', url: 'https://oulms.ou.ac.lk/course/view.php?id=3361' },
      { code: 'EEI4267', title: 'EEI4267 Requirement Engineering', url: 'https://oulms.ou.ac.lk/course/view.php?id=3435' },
      { code: 'EEI4360', title: 'Introduction to Artificial Intelligence', url: 'https://oulms.ou.ac.lk/course/view.php?id=3436' },
      { code: 'EEI4361', title: 'User Experience Engineering', url: 'https://oulms.ou.ac.lk/course/view.php?id=3439' },
      { code: 'EEI4362', title: 'Object Oriented Design', url: 'https://oulms.ou.ac.lk/course/view.php?id=3440' },
    ],
  };

  try {
    const sharedSettings = readJsonFile<UserSettings>(SETTINGS_FILE);
    return { ...defaults, ...sharedSettings };
  } catch (error) {
    console.error('Error reading settings.json:', error);
    return defaults;
  }
}

export function getClientSettings(): UserSettings {
  const { ousl_username, ousl_password, github_token, ...clientSettings } = getSettings();
  return clientSettings;
}

export function saveSettings(settings: Partial<UserSettings>): UserSettings {
  const current = getSettings();
  const safeSettings = { ...settings };
  delete safeSettings.ousl_username;
  delete safeSettings.ousl_password;
  delete safeSettings.github_token;
  const updated = { ...current, ...safeSettings };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const { ousl_username, ousl_password, github_token, ...sharedSettings } = updated;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(sharedSettings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving settings.json:', error);
  }
  return updated;
}
