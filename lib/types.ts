export interface AttachmentItem {
  name: string;
  url: string;
  type?: 'excel' | 'pdf' | 'csv' | 'doc' | 'image' | 'link' | 'other';
  size?: string;
  local_path?: string;
}

export interface ExtractedLinkItem {
  title: string;
  url: string;
  type?: 'sheets' | 'drive' | 'forms' | 'zoom' | 'grades' | 'quiz' | 'assignment' | 'general';
}

export interface NotificationItem {
  id: string;
  title: string;
  category: 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Announcements';
  course_code?: string;
  course_name?: string;
  time: string;
  link: string;
  is_new?: boolean;
  content?: string;
  content_html?: string;
  attachments?: AttachmentItem[];
  links?: ExtractedLinkItem[];
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
  content?: string;
  content_html?: string;
  attachments?: AttachmentItem[];
  links?: ExtractedLinkItem[];
}

export type CourseUpdate = ForumUpdateItem;

export type CourseResourceKind =
  | 'file'
  | 'page'
  | 'url'
  | 'forum'
  | 'assignment'
  | 'quiz'
  | 'folder'
  | 'book'
  | 'lesson'
  | 'recording'
  | 'label'
  | 'other';

export type CourseSectionCategory =
  | 'orientation'
  | 'ils'
  | 'readings'
  | 'assessment'
  | 'project'
  | 'exam'
  | 'general';

export type ExamStudyGroup =
  | 'Course Foundations'
  | 'ILS Sessions'
  | 'Core & Additional Reading'
  | 'Projects & Assessments'
  | 'Exam & Revision';

export interface CourseResourceItem {
  id: string;
  title: string;
  url: string;
  kind: CourseResourceKind;
  description?: string;
  file_type?: string;
  availability?: string;
  icon_alt?: string;
  section_title?: string;
  subsection?: string;
  study_group: ExamStudyGroup;
  is_exam_relevant: boolean;
  children?: CourseResourceItem[];
}

export interface CourseSectionItem {
  id: string;
  title: string;
  summary?: string;
  index: number;
  category: CourseSectionCategory;
  study_group: ExamStudyGroup;
  resources_count: number;
  resources: CourseResourceItem[];
}

export interface CourseItem {
  id: string;
  code: string;
  title: string;
  url: string;
  updates_count: number;
  updates: ForumUpdateItem[];
  sections_count?: number;
  resources_count?: number;
  sections?: CourseSectionItem[];
}

export interface DigestStats {
  total_notifications: number;
  total_courses: number;
  total_updates: number;
  total_sections?: number;
  total_resources?: number;
}

export interface LMSDataPayload {
  success: boolean;
  synced_at: string;
  github_run_id?: string;
  github_run_attempt?: string;
  duration_seconds: number;
  stats: DigestStats;
  notifications: NotificationItem[];
  courses: CourseItem[];
  available_courses?: DiscoveredCourseItem[];
}

export interface DiscoveredCourseItem {
  code: string;
  title: string;
  url: string;
}

export interface ConsoleLogItem {
  id: string;
  time: string;
  message: string;
  tag?: 'AUTH' | 'DISCOVERY' | 'CRAWLER' | 'SUCCESS' | 'ERROR' | 'INFO';
  type?: 'step' | 'done' | 'error' | 'info';
}

export interface UserSettings {
  time_1?: string;
  time_2?: string;
  time_3?: string;
  morning_time?: string;
  evening_time?: string;
  auto_sync_enabled: boolean;
  auto_sync_on_save?: boolean;
  last_sync_timestamp?: string;
  github_token?: string;
  github_repo?: string;
  ousl_username?: string;
  ousl_password?: string;
  selected_courses?: string[];
  discovered_courses?: DiscoveredCourseItem[];
}
