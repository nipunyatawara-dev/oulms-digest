export interface NotificationItem {
  id: string;
  title: string;
  category: 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Announcements';
  course_code?: string;
  course_name?: string;
  time: string;
  link: string;
  is_new?: boolean;
}

export interface ForumUpdateItem {
  id: string;
  course_code: string;
  course_name: string;
  forum_name: string;
  topic: string;
  author: string;
  time: string;
  category: 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Announcements';
  link: string;
  is_new?: boolean;
}

export type CourseUpdate = ForumUpdateItem;

export interface CourseItem {
  id: string;
  code: string;
  title: string;
  url: string;
  updates_count: number;
  updates: ForumUpdateItem[];
}

export interface DigestStats {
  total_notifications: number;
  total_courses: number;
  total_updates: number;
}

export interface LMSDataPayload {
  success: boolean;
  synced_at: string;
  duration_seconds: number;
  stats: DigestStats;
  notifications: NotificationItem[];
  courses: CourseItem[];
}

export interface UserSettings {
  time_1?: string;
  time_2?: string;
  time_3?: string;
  morning_time?: string;
  evening_time?: string;
  auto_sync_enabled: boolean;
  last_sync_timestamp?: string;
  github_token?: string;
  github_repo?: string;
}
