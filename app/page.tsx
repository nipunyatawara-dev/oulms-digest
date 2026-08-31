'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { CategoryFilter } from '@/components/CategoryTabs';
import { NotificationCard } from '@/components/NotificationCard';
import { CourseCard } from '@/components/CourseCard';
import { ScheduleModal } from '@/components/ScheduleModal';
import { SyncProgressDrawer, SyncLogItem } from '@/components/SyncProgressDrawer';
import { CourseSelectorView } from '@/components/CourseSelectorView';
import { MobileTabBar } from '@/components/MobileTabBar';
import { CourseDetailView, ExamPreparationView } from '@/components/CourseContentExplorer';
import { LMSDataPayload, UserSettings, CourseUpdate, AttachmentItem, ExtractedLinkItem } from '@/lib/types';
import { isWithinTimeframe } from '@/lib/dateUtils';
import { categorizeAcademicItem, getCourseGradebookUrl } from '@/lib/categoryUtils';
import { countExamResources } from '@/lib/courseContent';
import {
  Search,
  RefreshCw,
  BookOpen,
  Bell,
  Clock,
  ExternalLink,
  User,
  Award,
  Calendar,
  AlertCircle,
  Layers,
  FileSpreadsheet,
  FileText,
  File,
  Download,
  Link2,
  Table,
  ChevronDown,
  GraduationCap,
  Folder,
  Video,
  CheckSquare,
} from 'lucide-react';

interface UnifiedAcademicItem {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  category: 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Announcements';
  time: string;
  link: string;
  isNew: boolean;
  author: string;
  forumName: string;
  sourceType: 'portal_notification' | 'course_forum';
  content?: string;
  content_html?: string;
  attachments?: AttachmentItem[];
  links?: ExtractedLinkItem[];
}

const CATEGORY_META: Record<
  'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Announcements',
  { title: string; desc: string; icon: React.ComponentType<{ className?: string }> }
> = {
  'Grades & Marks': {
    title: 'Grades & Marks',
    desc: 'Assignment grades, CAT marks, TMA scores, and evaluation results.',
    icon: Award,
  },
  'Viva & Exam': {
    title: 'Viva & Exams',
    desc: 'Upcoming vivas, schedules, exam announcements, and repeat opportunities.',
    icon: Calendar,
  },
  'Deadlines & Quizzes': {
    title: 'Deadlines & Quizzes',
    desc: 'Assignment submissions, quiz deadlines, and cutoff dates.',
    icon: AlertCircle,
  },
  Announcements: {
    title: 'Announcements & Broadcasts',
    desc: 'Recent notices and updates from course forums and your OUSL portal.',
    icon: Bell,
  },
};

const COURSE_SELECTION_STORAGE_KEY = 'oulms-digest:selected-courses';

function courseMatchesSelection(courseCode: string, selectedCodes?: string[]) {
  if (!selectedCodes) return true;
  const course = courseCode.toLowerCase();
  return selectedCodes.some((selectedCode) => {
    const selected = selectedCode.toLowerCase();
    return course === selected || course.startsWith(selected) || selected.startsWith(course);
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<LMSDataPayload | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'24h' | '16d'>('24h');
  const [expandedCategoryItemId, setExpandedCategoryItemId] = useState<string | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'Dashboard' | 'Announcements' | 'Account'>('Dashboard');
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);

  // Sync Progress Drawer State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerMinimized, setIsDrawerMinimized] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentSyncMessage, setCurrentSyncMessage] = useState('');
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);
  const [isSyncComplete, setIsSyncComplete] = useState(false);
  const [isSyncError, setIsSyncError] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        let selectedCourses = json.settings?.selected_courses;
        const storedSelection = window.localStorage.getItem(COURSE_SELECTION_STORAGE_KEY);
        if (storedSelection) {
          try {
            const parsed = JSON.parse(storedSelection);
            if (Array.isArray(parsed)) selectedCourses = parsed;
          } catch {
            window.localStorage.removeItem(COURSE_SELECTION_STORAGE_KEY);
          }
        }
        setSettings({ ...json.settings, selected_courses: selectedCourses });
      }
    } catch (e) {
      console.error('Failed to load LMS data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSyncNow = (selectionOverride?: string[]) => {
    if (isSyncing) {
      setIsDrawerOpen(true);
      setIsDrawerMinimized(false);
      return;
    }

    const selectedForCrawl = selectionOverride || settings?.selected_courses;
    if (selectedForCrawl && selectedForCrawl.length === 0) {
      setIsDrawerOpen(true);
      setIsDrawerMinimized(false);
      setIsSyncError(true);
      setIsSyncComplete(false);
      setCurrentSyncMessage('Select at least one course before starting a crawl.');
      setSyncLogs([{
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message: 'Select at least one course before starting a crawl.',
        progress: 0,
        type: 'error',
      }]);
      return;
    }

    setIsSyncing(true);
    setIsDrawerOpen(true);
    setIsDrawerMinimized(false);
    setSyncProgress(5);
    setCurrentSyncMessage('Connecting to OUSL IAM Keycloak server...');
    setIsSyncComplete(false);
    setIsSyncError(false);

    const initialLog: SyncLogItem = {
      id: `log-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: 'Started on-demand academic crawl',
      progress: 5,
      type: 'step',
    };
    setSyncLogs([initialLog]);

    try {
      const params = new URLSearchParams();
      if (selectedForCrawl?.length) params.set('courses', selectedForCrawl.join(','));
      const eventSource = new EventSource(`/api/sync?${params.toString()}`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          if (payload.type === 'start' || payload.type === 'progress') {
            setSyncProgress(payload.progress);
            setCurrentSyncMessage(payload.message);
            setSyncLogs((prev) => [
              ...prev,
              {
                id: `log-${Date.now()}-${Math.random()}`,
                time: timeStr,
                message: payload.message,
                progress: payload.progress,
                type: 'step',
              },
            ]);
          } else if (payload.type === 'done') {
            setSyncProgress(100);
            setCurrentSyncMessage('Academic digest updated successfully!');
            setIsSyncComplete(true);
            setIsSyncing(false);
            if (payload.data) setData(payload.data);
            if (payload.settings) {
              setSettings((current) => ({
                ...payload.settings,
                selected_courses: current?.selected_courses || payload.settings.selected_courses,
              }));
            }
            setSyncLogs((prev) => [
              ...prev,
              {
                id: `log-${Date.now()}`,
                time: timeStr,
                message: 'All 7 enrolled courses crawled and saved to store',
                progress: 100,
                type: 'done',
              },
            ]);
            eventSource.close();
          } else if (payload.type === 'error') {
            setIsSyncError(true);
            setIsSyncing(false);
            setCurrentSyncMessage(payload.message || 'Crawler error occurred.');
            setSyncLogs((prev) => [
              ...prev,
              {
                id: `log-${Date.now()}`,
                time: timeStr,
                message: `Error: ${payload.message}`,
                progress: syncProgress,
                type: 'error',
              },
            ]);
            eventSource.close();
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('EventSource error:', err);
        eventSource.close();
        setIsSyncing(false);
      };
    } catch (e) {
      console.error('Sync trigger error:', e);
      setIsSyncing(false);
      setIsSyncError(true);
    }
  };

  const handleSaveSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const json = await res.json();
        if (newSettings.selected_courses !== undefined) {
          window.localStorage.setItem(
            COURSE_SELECTION_STORAGE_KEY,
            JSON.stringify(newSettings.selected_courses)
          );
        }
        setSettings({
          ...json.settings,
          ...(newSettings.selected_courses !== undefined
            ? { selected_courses: newSettings.selected_courses }
            : {}),
        });
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  // Base date for calculating relative time accurately
  const syncedBaseDate = useMemo(() => {
    if (data?.synced_at) {
      const dateStr = data.synced_at.endsWith('Z') ? data.synced_at : `${data.synced_at}Z`;
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [data?.synced_at]);

  const visibleCourses = useMemo(
    () => (data?.courses || []).filter((course) => courseMatchesSelection(course.code, settings?.selected_courses)),
    [data?.courses, settings?.selected_courses]
  );

  const visibleNotifications = useMemo(
    () => (data?.notifications || []).filter((notification) => {
      if (!notification.course_code || notification.course_code === 'PORTAL') return true;
      return courseMatchesSelection(notification.course_code, settings?.selected_courses);
    }),
    [data?.notifications, settings?.selected_courses]
  );

  // Extract all unified items from notifications and course forums
  const allAcademicItems = useMemo<UnifiedAcademicItem[]>(() => {
    const list: UnifiedAcademicItem[] = [];

    // 1. From portal notifications
    visibleNotifications.forEach((n) => {
      const cat = categorizeAcademicItem(n.title);
      list.push({
        id: `notif-${n.id}`,
        title: n.title,
        courseCode: n.course_code || 'PORTAL',
        courseName: n.course_name || 'OUSL Portal Notice',
        category: cat,
        time: n.time,
        link: n.link && n.link !== '#' ? n.link : 'https://oulms.ou.ac.lk/message/output/popup/notifications.php',
        isNew: !!n.is_new,
        author: 'Faculty Alert',
        forumName: 'Portal Notifications',
        sourceType: 'portal_notification',
        content: n.content || n.title,
        content_html: n.content_html,
        attachments: n.attachments || [],
        links: n.links || [],
      });
    });

    // 2. From course forums
    visibleCourses.forEach((course) => {
      (course.updates || []).forEach((update) => {
        const cat = categorizeAcademicItem(update.topic);
        list.push({
          id: `upd-${course.code}-${update.id}`,
          title: update.topic,
          courseCode: course.code,
          courseName: course.title.replace(course.code, '').trim() || course.title,
          category: cat,
          time: update.time,
          link: update.link,
          isNew: !!update.is_new,
          author: update.author || 'Course Lecturer',
          forumName: update.forum_name || 'Course Forum',
          sourceType: 'course_forum',
          content: update.content || update.topic,
          content_html: update.content_html,
          attachments: update.attachments || [],
          links: update.links || [],
        });
      });
    });

    return list;
  }, [visibleCourses, visibleNotifications]);

  // Counts helper for any category and timeframe
  const getCategoryCounts = (category: 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Announcements') => {
    const items = allAcademicItems.filter((i) => {
      if (category === 'Announcements') {
        return i.category === 'Announcements' || i.sourceType === 'portal_notification';
      }
      return i.category === category;
    });
    const count24h = items.filter((i) => isWithinTimeframe(i.time, '24h', syncedBaseDate)).length;
    const count16d = items.filter((i) => isWithinTimeframe(i.time, '16d', syncedBaseDate)).length;
    return { count24h, count16d, total: items.length };
  };

  const announcementsCounts = useMemo(() => getCategoryCounts('Announcements'), [allAcademicItems, syncedBaseDate]);
  const gradesCounts = useMemo(() => getCategoryCounts('Grades & Marks'), [allAcademicItems, syncedBaseDate]);
  const vivaCounts = useMemo(() => getCategoryCounts('Viva & Exam'), [allAcademicItems, syncedBaseDate]);
  const deadlinesCounts = useMemo(() => getCategoryCounts('Deadlines & Quizzes'), [allAcademicItems, syncedBaseDate]);

  // Standard Dashboard Filter calculations
  const allNotifications = visibleNotifications;
  const allCourses = visibleCourses;
  const availableCourses = data?.available_courses?.length
    ? data.available_courses
    : settings?.discovered_courses?.length
      ? settings.discovered_courses
      : (data?.courses || []).map((course) => ({ code: course.code, title: course.title, url: course.url }));

  const allUpdates: CourseUpdate[] = [];
  allCourses.forEach((c) => {
    if (c.updates) allUpdates.push(...c.updates);
  });

  const sidebarCounts = {
    all: allNotifications.length + allUpdates.length,
    grades: gradesCounts.total,
    viva: vivaCounts.total,
    deadlines: deadlinesCounts.total,
    courses: allCourses.length,
    examPrep: allCourses.reduce((total, course) => total + countExamResources(course.sections), 0),
  };

  const selectedCourse = selectedCourseCode
    ? allCourses.find((course) => course.code === selectedCourseCode) || null
    : null;

  // Filtered items for Dedicated Category Views (Grades, Viva, Deadlines, Announcements)
  const getFilteredCategoryItems = (category: 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Announcements') => {
    return allAcademicItems.filter((item) => {
      if (category === 'Announcements') {
        if (item.category !== 'Announcements' && item.sourceType !== 'portal_notification') {
          return false;
        }
      } else {
        if (item.category !== category) return false;
      }
      const matchesTime = isWithinTimeframe(item.time, timeframe, syncedBaseDate);
      if (!matchesTime) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.courseCode.toLowerCase().includes(q) ||
        item.courseName.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.forumName.toLowerCase().includes(q)
      );
    });
  };

  // Filtered Notifications for Overview View
  const filteredOverviewNotifications = allNotifications.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery.trim() ||
      n.title.toLowerCase().includes(q) ||
      (n.course_code && n.course_code.toLowerCase().includes(q)) ||
      (n.course_name && n.course_name.toLowerCase().includes(q))
    );
  });

  // Filtered Courses for Enrolled Courses View & Overview View
  const filteredCourses = allCourses.map((c) => {
    const q = searchQuery.toLowerCase();
    const filteredUpdates = (c.updates || []).filter((u) => {
      if (!searchQuery.trim()) return true;
      return (
        u.topic.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        u.author.toLowerCase().includes(q)
      );
    });

    return {
      ...c,
      updates: filteredUpdates,
      updates_count: filteredUpdates.length,
    };
  }).filter((c) => {
    if (activeTab === 'Courses') {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    }
    return c.updates && c.updates.length > 0;
  });

  // Determine current active category mode
  const isDedicatedCategoryView =
    activeView !== 'Account' &&
    (activeView === 'Announcements' ||
      activeTab === 'Grades & Marks' ||
      activeTab === 'Viva & Exam' ||
      activeTab === 'Deadlines & Quizzes');

  const currentCategoryKey: 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Announcements' =
    activeView === 'Announcements'
      ? 'Announcements'
      : (activeTab as 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes');

  const currentCategoryCounts =
    currentCategoryKey === 'Grades & Marks'
      ? gradesCounts
      : currentCategoryKey === 'Viva & Exam'
      ? vivaCounts
      : currentCategoryKey === 'Deadlines & Quizzes'
      ? deadlinesCounts
      : announcementsCounts;

  const currentCategoryItems = isDedicatedCategoryView ? getFilteredCategoryItems(currentCategoryKey) : [];

  return (
    <div className="min-h-screen bg-[#fbf8f5] dark:bg-[#0f0f11] text-[#4e080c] dark:text-[#f4f4f5] transition-colors duration-200">
      {/* Top Navigation Header */}
      <Header
        isSyncing={isSyncing}
        onSync={() => handleSyncNow()}
        onOpenSchedule={() => setIsScheduleOpen(true)}
        onToggleDrawer={() => {
          setIsDrawerOpen(true);
          setIsDrawerMinimized(false);
        }}
        hasLogs={syncLogs.length > 0}
        settings={settings}
        lastSyncedAt={data?.synced_at}
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
          setSearchQuery('');
        }}
        announcementsCount={announcementsCounts.count24h > 0 ? announcementsCounts.count24h : announcementsCounts.count16d}
      />

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-5 sm:py-8">
        <div className="flex items-start gap-6 lg:gap-8">
          {/* Left Column: Persistent Desktop Sidebar */}
          {activeView !== 'Announcements' && (
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setSearchQuery('');
                if (tab !== 'Courses') setSelectedCourseCode(null);
              }}
              counts={sidebarCounts}
              activeView={activeView}
              onSelectView={setActiveView}
              studentUsername={settings?.ousl_username}
            />
          )}

          {/* Right Column: Main Content Canvas */}
          <main className="flex-1 min-w-0 space-y-5 ios-safe-pb-nav">
            {activeView === 'Account' ? (
              <CourseSelectorView
                settings={settings}
                availableCourses={availableCourses}
                onSaveSettings={handleSaveSettings}
                onCrawlSelection={(courseCodes) => handleSyncNow(courseCodes)}
                isSyncing={isSyncing}
              />
            ) : activeTab === 'Exam Preparation' && activeView === 'Dashboard' ? (
              <ExamPreparationView courses={allCourses} />
            ) : activeTab === 'Courses' && selectedCourse && activeView === 'Dashboard' ? (
              <CourseDetailView course={selectedCourse} onBack={() => setSelectedCourseCode(null)} />
            ) : isDedicatedCategoryView ? (
              /* ========================================================================= */
              /* DEDICATED SEPARATE PAGES: Grades, Viva, Deadlines, Announcements          */
              /* (Shows only the category's items with Last 24 Hours / Last 16 Days toggle)*/
              /* ========================================================================= */
              <div className="space-y-5">
                {/* Dedicated Category Header Card */}
                {(() => {
                  const meta = CATEGORY_META[currentCategoryKey];
                  const Icon = meta.icon;
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#f2ebe5] dark:bg-[#18181b] p-5 sm:p-6 rounded-2xl shadow-refero-sm border border-transparent dark:border-white/[0.08]">
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-[#4e080c] dark:text-[#f4f4f5]" />
                          <h1 className="text-[17px] sm:text-[18px] font-semibold text-[#4e080c] dark:text-[#f4f4f5] tracking-tight">
                            {meta.title}
                          </h1>
                        </div>
                        <p className="text-[12.5px] sm:text-[13px] text-[#71717A] dark:text-[#a1a1aa] mt-1">
                          {meta.desc}
                        </p>
                      </div>

                      {/* 24h / 16d Timeframe Toggle */}
                      <div className="flex items-center p-1 bg-[#4e080c]/[0.05] dark:bg-white/[0.06] rounded-xl self-start sm:self-auto select-none gap-1" role="group" aria-label="Timeframe selector">
                        <button
                          onClick={() => setTimeframe('24h')}
                          aria-pressed={timeframe === '24h'}
                          className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 min-h-[40px] active:scale-[0.98] ${
                            timeframe === '24h'
                              ? 'bg-white dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] shadow-refero-sm font-semibold'
                              : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5]'
                          }`}
                        >
                          <span>Last 24 Hours</span>
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                              timeframe === '24h'
                                ? 'bg-[#4e080c] text-white'
                                : 'bg-[#4e080c]/[0.12] dark:bg-white/[0.12] text-[#71717A] dark:text-[#a1a1aa]'
                            }`}
                          >
                            {currentCategoryCounts.count24h}
                          </span>
                        </button>

                        <button
                          onClick={() => setTimeframe('16d')}
                          aria-pressed={timeframe === '16d'}
                          className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 min-h-[40px] active:scale-[0.98] ${
                            timeframe === '16d'
                              ? 'bg-white dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] shadow-refero-sm font-semibold'
                              : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5]'
                          }`}
                        >
                          <span>Last 16 Days</span>
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                              timeframe === '16d'
                                ? 'bg-[#4e080c] text-white'
                                : 'bg-[#4e080c]/[0.12] dark:bg-white/[0.12] text-[#71717A] dark:text-[#a1a1aa]'
                            }`}
                          >
                            {currentCategoryCounts.count16d}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Search Bar & Result Summary */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="text-[13px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">
                    Showing {currentCategoryItems.length}{' '}
                    {currentCategoryItems.length === 1 ? 'item' : 'items'} from the{' '}
                    {timeframe === '24h' ? 'last 24 hours' : 'last 16 days'}
                  </div>

                  <div className="relative min-w-[240px] sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#a1a1aa]" />
                    <input
                      type="text"
                      placeholder={`Search in ${CATEGORY_META[currentCategoryKey].title}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-1.5 text-[13px] bg-white dark:bg-[#18181b] text-[#4e080c] dark:text-[#f4f4f5] rounded-lg border border-[#4e080c]/[0.12] dark:border-white/[0.12] shadow-refero-sm focus:outline-none focus:ring-1 focus:ring-[#4e080c]/20 dark:focus:ring-white/20 transition-all placeholder:text-[#71717A] dark:placeholder:text-[#71717a]"
                    />
                  </div>
                </div>

                {/* Category Items List (No course containers) */}
                {loading ? (
                  <div className="p-16 text-center text-[#71717A] dark:text-[#a1a1aa] flex flex-col items-center justify-center gap-2 bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl border border-transparent dark:border-white/[0.08]">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#4e080c] dark:text-[#a1a1aa]" />
                    <p className="text-[13.5px] font-medium text-[#4e080c] dark:text-[#f4f4f5]">
                      Loading updates...
                    </p>
                  </div>
                ) : currentCategoryItems.length > 0 ? (
                  <div className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl divide-y divide-[#4e080c]/[0.05] dark:divide-white/[0.06] overflow-hidden shadow-refero-sm border border-transparent dark:border-white/[0.08]">
                    {currentCategoryItems.map((item) => {
                      const isExpanded = expandedCategoryItemId === item.id;
                      const validLinks = item.links || [];
                      const hasAttachments = Boolean(item.attachments && item.attachments.length > 0);
                      const hasLinks = validLinks.length > 0;
                      const isGrades = item.category === 'Grades & Marks';
                      const gradebookUrl = getCourseGradebookUrl(item.link);

                      return (
                        <div key={item.id} className="transition-colors hover:bg-[#4e080c]/[0.015] dark:hover:bg-white/[0.02]">
                          {/* Item Row Header */}
                          <div
                            onClick={() =>
                              setExpandedCategoryItemId((prev) => (prev === item.id ? null : item.id))
                            }
                            className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none group min-h-[54px] active:bg-[#4e080c]/[0.03] dark:active:bg-white/[0.04] transition-colors"
                          >
                            <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                              {/* Course Code Badge */}
                              <div className="px-2.5 py-1 rounded-lg bg-[#4e080c] text-white font-mono font-semibold text-[11.5px] tracking-wide shrink-0 shadow-refero-sm mt-0.5 sm:mt-0 group-hover:scale-105 transition-transform">
                                {item.courseCode}
                              </div>

                              {/* Content Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[13.5px] sm:text-[14px] font-semibold text-[#4e080c] dark:text-[#f4f4f5] group-hover:text-[#620a0f] dark:group-hover:text-white transition-colors leading-snug break-words">
                                    {item.title}
                                  </span>
                                  {item.isNew && (
                                    <span className="px-1.5 py-0.5 text-[10.5px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-md">
                                      New
                                    </span>
                                  )}
                                  {item.category === 'Grades & Marks' && (
                                    <span className="px-1.5 py-0.5 text-[10.5px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 rounded-md">
                                      Marks
                                    </span>
                                  )}
                                </div>

                                <div className="text-[12px] text-[#71717A] dark:text-[#a1a1aa] flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="font-medium text-[#4e080c] dark:text-[#f4f4f5] truncate max-w-[200px] sm:max-w-sm">
                                    {item.courseName}
                                  </span>
                                  {item.forumName && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="truncate max-w-[180px]">{item.forumName}</span>
                                    </>
                                  )}
                                  {item.author && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="inline-flex items-center gap-1">
                                        <User className="w-3 h-3 text-[#8E8E93] dark:text-[#71717a]" />
                                        {item.author}
                                      </span>
                                    </>
                                  )}
                                  {item.time && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="inline-flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-[#8E8E93] dark:text-[#71717a]" />
                                        {item.time}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Actions: Open Link & Expand Toggle */}
                            <div
                              className="flex items-center gap-1.5 sm:gap-2 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 text-[12.5px] font-medium text-[#4e080c] dark:text-[#f4f4f5] bg-white dark:bg-[#27272a] hover:bg-[#f5efe9] dark:hover:bg-[#323238] border border-[#4e080c]/[0.12] dark:border-white/[0.12] rounded-lg shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
                                title="Open in Moodle / Portal"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3.5 h-3.5 text-[#71717A] dark:text-[#a1a1aa]" />
                              </a>

                              <button
                                onClick={() =>
                                  setExpandedCategoryItemId((prev) =>
                                    prev === item.id ? null : item.id
                                  )
                                }
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.05] dark:hover:bg-white/[0.06] rounded-lg transition-colors active:scale-95"
                                title={isExpanded ? 'Collapse details' : 'Expand full details'}
                                aria-label={isExpanded ? 'Collapse details' : 'Expand full details'}
                                aria-expanded={isExpanded}
                              >
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180 text-[#4e080c] dark:text-[#f4f4f5]' : ''
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Tile Body */}
                          {isExpanded && (
                            <div className="border-t border-[#4e080c]/[0.06] dark:border-white/[0.06] bg-[#fdfaf8] dark:bg-[#151518] px-5 py-4 sm:px-6 sm:py-5 space-y-4 animate-in fade-in-50 duration-200">
                              {/* Full Content / Message Body */}
                              {item.content && (
                                <div className="text-[13px] sm:text-[13.5px] text-[#4e080c] dark:text-[#f4f4f5] leading-relaxed whitespace-pre-line bg-white dark:bg-[#1f1f23] p-3.5 rounded-xl border border-[#4e080c]/[0.08] dark:border-white/[0.08] shadow-refero-sm">
                                  {item.content}
                                </div>
                              )}

                              {/* Direct Target Links & Contextual Actions */}
                              {(hasLinks || (isGrades && gradebookUrl)) && (
                                <div className="space-y-2">
                                  <div className="text-[11.5px] font-semibold tracking-wider uppercase text-[#71717A] dark:text-[#a1a1aa] flex items-center gap-1.5">
                                    <span>Direct Action:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2.5">
                                    {validLinks.map((lk, i) => {
                                      const t = (lk.title + ' ' + lk.url).toLowerCase();
                                      const isSheet = lk.type === 'sheets' || t.includes('sheet') || t.includes('excel') || t.includes('marks');
                                      const isForm = lk.type === 'forms' || t.includes('form') || t.includes('survey');
                                      const isGrade = lk.type === 'grades' || t.includes('gradebook') || t.includes('grade');
                                      const isDrive = lk.type === 'drive' || t.includes('drive') || t.includes('onedrive');
                                      const isZoom = lk.type === 'zoom' || t.includes('zoom') || t.includes('teams') || t.includes('meet');

                                      return (
                                        <a
                                          key={i}
                                          href={lk.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/50 rounded-xl text-[13px] font-semibold shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
                                        >
                                          {isSheet ? (
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                          ) : isForm ? (
                                            <CheckSquare className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                                          ) : isGrade ? (
                                            <GraduationCap className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                                          ) : isDrive ? (
                                            <Folder className="w-4 h-4 text-indigo-700 dark:text-indigo-400 shrink-0" />
                                          ) : isZoom ? (
                                            <Video className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0" />
                                          ) : (
                                            <ExternalLink className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                          )}
                                          <span>{lk.title}</span>
                                        </a>
                                      );
                                    })}

                                    {!hasLinks && isGrades && gradebookUrl && (
                                      <a
                                        href={gradebookUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/50 rounded-xl text-[13px] font-semibold shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
                                        title="Open course gradebook on OUSL Portal"
                                      >
                                        <GraduationCap className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                                        <span>Check Course Gradebook</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Attached Files (Excel, CSV, PDF) */}
                              {hasAttachments && (
                                <div className="space-y-2">
                                  <div className="text-[11.5px] font-semibold tracking-wider uppercase text-[#71717A] dark:text-[#a1a1aa] flex items-center gap-1.5">
                                    <span>Attached Files:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2.5">
                                    {item.attachments?.map((att, i) => (
                                      <a
                                        key={i}
                                        href={att.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#1f1f23] hover:bg-[#f5efe9] dark:hover:bg-[#27272a] active:bg-[#ede3da] text-[#4e080c] dark:text-[#f4f4f5] border border-[#4e080c]/[0.12] dark:border-white/[0.12] rounded-xl text-[12.5px] font-medium shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
                                      >
                                        {att.type === 'excel' || att.type === 'csv' ? (
                                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        ) : att.type === 'pdf' ? (
                                          <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                        ) : (
                                          <File className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa] shrink-0" />
                                        )}
                                        <span className="truncate max-w-xs">{att.name}</span>
                                        <Download className="w-3.5 h-3.5 text-[#71717A] dark:text-[#a1a1aa] shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="p-16 text-center bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl text-[#71717A] dark:text-[#a1a1aa] border border-transparent dark:border-white/[0.08] space-y-2">
                    {React.createElement(CATEGORY_META[currentCategoryKey].icon, {
                      className: 'w-8 h-8 mx-auto text-[#71717A] dark:text-[#a1a1aa]',
                    })}
                    <h3 className="text-[15px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">
                      No {CATEGORY_META[currentCategoryKey].title.toLowerCase()} in the{' '}
                      {timeframe === '24h' ? 'last 24 hours' : 'last 16 days'}
                    </h3>
                    <p className="text-[12.5px] max-w-sm mx-auto leading-relaxed">
                      {timeframe === '24h'
                        ? `No items were posted in the last 24 hours. Switch to "Last 16 Days" to review earlier updates.`
                        : `No items were found for the last 16 days.`}
                    </p>
                    {timeframe === '24h' && currentCategoryCounts.count16d > 0 && (
                      <div className="pt-2">
                        <button
                          onClick={() => setTimeframe('16d')}
                          className="px-4 py-1.5 bg-white dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] border border-[#4e080c]/[0.12] dark:border-white/[0.12] rounded-lg text-[12.5px] font-medium hover:bg-[#f5efe9] dark:hover:bg-[#323238] shadow-refero-sm transition-all"
                        >
                          View Last 16 Days ({currentCategoryCounts.count16d})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === 'Courses' ? (
              /* ========================================================================= */
              /* ENROLLED COURSES VIEW (Dedicated Enrolled Courses List)                   */
              /* ========================================================================= */
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#f2ebe5] dark:bg-[#18181b] p-5 sm:p-6 rounded-2xl shadow-refero-sm border border-transparent dark:border-white/[0.08]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#4e080c] dark:text-[#f4f4f5]" />
                      <h1 className="text-[17px] sm:text-[18px] font-semibold text-[#4e080c] dark:text-[#f4f4f5] tracking-tight">
                        Enrolled Courses
                      </h1>
                    </div>
                    <p className="text-[12.5px] sm:text-[13px] text-[#71717A] dark:text-[#a1a1aa] mt-1">
                      Your {allCourses.length} registered active semester courses on OUSL Moodle.
                    </p>
                  </div>
                  <div className="text-[12.5px] font-medium px-3 py-1 bg-white dark:bg-[#27272a] rounded-lg border border-[#4e080c]/[0.12] dark:border-white/[0.12] shadow-refero-sm text-[#4e080c] dark:text-[#f4f4f5] self-start sm:self-auto">
                    {allCourses.length} Registered Courses
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <span className="text-[13px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">
                    Showing {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
                  </span>

                  <div className="relative min-w-[240px] sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#a1a1aa]" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-1.5 text-[13px] bg-white dark:bg-[#18181b] text-[#4e080c] dark:text-[#f4f4f5] rounded-lg border border-[#4e080c]/[0.12] dark:border-white/[0.12] shadow-refero-sm focus:outline-none focus:ring-1 focus:ring-[#4e080c]/20 dark:focus:ring-white/20 transition-all placeholder:text-[#71717A] dark:placeholder:text-[#71717a]"
                    />
                  </div>
                </div>

                {/* Enrolled Courses List */}
                {loading ? (
                  <div className="p-16 text-center text-[#71717A] dark:text-[#a1a1aa] flex flex-col items-center justify-center gap-2 bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl border border-transparent dark:border-white/[0.08]">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#4e080c] dark:text-[#a1a1aa]" />
                    <p className="text-[13.5px] font-medium text-[#4e080c] dark:text-[#f4f4f5]">
                      Loading courses...
                    </p>
                  </div>
                ) : filteredCourses.length > 0 ? (
                  <div className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl divide-y divide-[#4e080c]/[0.05] dark:divide-white/[0.06] overflow-hidden shadow-refero-sm border border-transparent dark:border-white/[0.08]">
                    {filteredCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        defaultExpanded={false}
                        onOpenDetails={(selected) => setSelectedCourseCode(selected.code)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl text-[#71717A] dark:text-[#a1a1aa] border border-transparent dark:border-white/[0.08]">
                    <BookOpen className="w-7 h-7 mx-auto mb-2 text-[#71717A] dark:text-[#a1a1aa]" />
                    <p className="text-[14px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">
                      No courses found
                    </p>
                    <p className="text-[12px] mt-0.5">
                      Try searching with a different course code or title.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* ========================================================================= */
              /* OVERVIEW VIEW (All Academic Feeds & Recent Activity)                      */
              /* ========================================================================= */
              <div className="space-y-4 sm:space-y-5">
                {/* Search Bar & Active Filter Label */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">
                      All Academic Feeds
                    </span>
                  </div>

                  <div className="relative min-w-[240px] sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#a1a1aa]" />
                    <input
                      type="text"
                      placeholder="Search announcements, CATs, vivas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-1.5 text-[13px] bg-white dark:bg-[#18181b] text-[#4e080c] dark:text-[#f4f4f5] rounded-lg border border-[#4e080c]/[0.12] dark:border-white/[0.12] shadow-refero-sm focus:outline-none focus:ring-1 focus:ring-[#4e080c]/20 dark:focus:ring-white/20 transition-all placeholder:text-[#71717A] dark:placeholder:text-[#71717a]"
                    />
                  </div>
                </div>

                {/* Content Feed Section */}
                {loading ? (
                  <div className="p-16 text-center text-[#71717A] dark:text-[#a1a1aa] flex flex-col items-center justify-center gap-2 bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl border border-transparent dark:border-white/[0.08]">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#4e080c] dark:text-[#a1a1aa]" />
                    <p className="text-[13.5px] font-medium text-[#4e080c] dark:text-[#f4f4f5]">
                      Loading academic updates...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 1. Portal Notifications & System Alerts Group */}
                    {filteredOverviewNotifications.length > 0 && (
                      <div className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl divide-y divide-[#4e080c]/[0.05] dark:divide-white/[0.06] overflow-hidden shadow-refero-sm border border-transparent dark:border-white/[0.08]">
                        {filteredOverviewNotifications.map((notif) => (
                          <NotificationCard key={notif.id} notification={notif} />
                        ))}
                      </div>
                    )}

                    {/* 2. Course Announcements & Discussions Group */}
                    {filteredCourses.length > 0 ? (
                      <div className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl divide-y divide-[#4e080c]/[0.05] dark:divide-white/[0.06] overflow-hidden shadow-refero-sm border border-transparent dark:border-white/[0.08]">
                        {filteredCourses.map((course) => (
                          <CourseCard
                            key={course.id}
                            course={course}
                            defaultExpanded={filteredCourses.length <= 3}
                            onOpenDetails={(selected) => {
                              setActiveTab('Courses');
                              setSelectedCourseCode(selected.code);
                            }}
                          />
                        ))}
                      </div>
                    ) : filteredOverviewNotifications.length === 0 ? (
                      <div className="p-12 text-center bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl text-[#71717A] dark:text-[#a1a1aa] border border-transparent dark:border-white/[0.08]">
                        <BookOpen className="w-7 h-7 mx-auto mb-2 text-[#71717A] dark:text-[#a1a1aa]" />
                        <p className="text-[14px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">
                          No updates matching your search
                        </p>
                        <p className="text-[12px] mt-0.5">
                          Try searching with a different term or select a category from the sidebar.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Schedule Settings Modal */}
      {settings && (
        <ScheduleModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          settings={settings}
          onSave={handleSaveSettings}
        />
      )}

      {/* Live Sync Progress Drawer */}
      <SyncProgressDrawer
        isOpen={isDrawerOpen}
        isMinimized={isDrawerMinimized}
        onMinimize={setIsDrawerMinimized}
        onClose={() => setIsDrawerOpen(false)}
        progress={syncProgress}
        currentMessage={currentSyncMessage}
        logs={syncLogs}
        isComplete={isSyncComplete}
        isError={isSyncError}
      />

      {/* iOS Native Bottom Navigation Tab Bar */}
      <MobileTabBar
        activeView={activeView}
        activeTab={activeTab}
        onSelectView={(v) => {
          setActiveView(v);
          setSearchQuery('');
        }}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
        gradesCount={gradesCounts.count24h > 0 ? gradesCounts.count24h : gradesCounts.count16d}
        vivaCount={vivaCounts.count24h > 0 ? vivaCounts.count24h : vivaCounts.count16d}
        deadlinesCount={deadlinesCounts.count24h > 0 ? deadlinesCounts.count24h : deadlinesCounts.count16d}
        coursesCount={allCourses.length}
        examPrepCount={sidebarCounts.examPrep}
      />
    </div>
  );
}
