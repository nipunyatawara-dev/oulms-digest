export interface NotificationItem {
  id: string;
  title: string;
  category: 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Announcements';
  course_code?: string;
  course_name?: string;
  time: string;
  link: string;
  is_new: boolean;
}

export interface CourseUpdate {
  id: string;
  course_code: string;
  course_name: string;
  forum_name: string;
  topic: string;
  author: string;
  time: string;
  category: 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Announcements';
  link: string;
  is_new: boolean;
}

export interface CourseItem {
  id: string;
  code: string;
  title: string;
  url: string;
  updates_count: number;
  updates: CourseUpdate[];
}

export interface LMSDataPayload {
  success: boolean;
  synced_at: string;
  duration_seconds: number;
  stats: {
    total_notifications: number;
    total_courses: number;
    total_updates: number;
  };
  notifications: NotificationItem[];
  courses: CourseItem[];
}

export interface UserSettings {
  morning_time: string; // e.g. "07:30"
  evening_time: string; // e.g. "19:30"
  auto_sync_enabled: boolean;
  last_sync_timestamp: string;
}
