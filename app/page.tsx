'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { CategoryFilter } from '@/components/CategoryTabs';
import { NotificationCard } from '@/components/NotificationCard';
import { CourseCard } from '@/components/CourseCard';
import { ScheduleModal } from '@/components/ScheduleModal';
import { SyncProgressDrawer, SyncLogItem } from '@/components/SyncProgressDrawer';
import { LMSDataPayload, UserSettings, NotificationItem, CourseUpdate } from '@/lib/types';
import { isWithinTimeframe } from '@/lib/dateUtils';
import {
  Search,
  RefreshCw,
  BookOpen,
  Bell,
  Clock,
  ExternalLink,
  User,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';

interface UnifiedAnnouncement {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  category: string;
  time: string;
  link: string;
  isNew: boolean;
  author: string;
  forumName: string;
  sourceType: 'portal_notification' | 'course_forum';
}

export default function DashboardPage() {
  const [data, setData] = useState<LMSDataPayload | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [announcementSearchQuery, setAnnouncementSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'24h' | '7d'>('24h');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'Dashboard' | 'Announcements'>('Dashboard');

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
        setSettings(json.settings);
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

  const handleSyncNow = () => {
    if (isSyncing) {
      setIsDrawerOpen(true);
      setIsDrawerMinimized(false);
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
      const eventSource = new EventSource('/api/sync');

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
            if (payload.settings) setSettings(payload.settings);
            setSyncLogs((prev) => [
              ...prev,
              {
                id: `log-${Date.now()}`,
                time: timeStr,
                message: 'All 19 courses crawled and saved to local store',
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
        setSettings(json.settings);
      }
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  // Base date for calculating relative time
  const syncedBaseDate = useMemo(() => {
    if (data?.synced_at) {
      const parsed = new Date(data.synced_at);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [data?.synced_at]);

  // Extract all unified announcements from notifications and course forums
  const allAnnouncements = useMemo<UnifiedAnnouncement[]>(() => {
    const list: UnifiedAnnouncement[] = [];

    // 1. From portal notifications
    (data?.notifications || []).forEach((n) => {
      list.push({
        id: `notif-${n.id}`,
        title: n.title,
        courseCode: n.course_code || 'PORTAL',
        courseName: n.course_name || 'OUSL Portal Notice',
        category: n.category,
        time: n.time,
        link: n.link && n.link !== '#' ? n.link : 'https://oulms.ou.ac.lk/message/output/popup/notifications.php',
        isNew: !!n.is_new,
        author: 'Faculty Alert',
        forumName: 'Portal Notifications',
        sourceType: 'portal_notification',
      });
    });

    // 2. From course forums
    (data?.courses || []).forEach((course) => {
      (course.updates || []).forEach((update) => {
        list.push({
          id: `update-${update.id}`,
          title: update.topic,
          courseCode: course.code,
          courseName: course.title.replace(course.code, '').trim() || course.title,
          category: update.category,
          time: update.time,
          link: update.link,
          isNew: !!update.is_new,
          author: update.author || 'Course Lecturer',
          forumName: update.forum_name || 'Course Announcements',
          sourceType: 'course_forum',
        });
      });
    });

    return list;
  }, [data]);

  // Counts for 24 hours and 7 days
  const announcements24hCount = useMemo(() => {
    return allAnnouncements.filter((a) => isWithinTimeframe(a.time, '24h', syncedBaseDate)).length;
  }, [allAnnouncements, syncedBaseDate]);

  const announcements7dCount = useMemo(() => {
    return allAnnouncements.filter((a) => isWithinTimeframe(a.time, '7d', syncedBaseDate)).length;
  }, [allAnnouncements, syncedBaseDate]);

  // Filtered Announcements for the Announcements View
  const filteredAnnouncements = useMemo(() => {
    return allAnnouncements.filter((item) => {
      // Timeframe check
      const matchesTime = isWithinTimeframe(item.time, timeframe, syncedBaseDate);
      if (!matchesTime) return false;

      // Search check
      if (!announcementSearchQuery.trim()) return true;
      const query = announcementSearchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.courseCode.toLowerCase().includes(query) ||
        item.courseName.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.forumName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [allAnnouncements, timeframe, syncedBaseDate, announcementSearchQuery]);

  // Standard Dashboard Filter calculations
  const allNotifications = data?.notifications || [];
  const allCourses = data?.courses || [];
  
  const allUpdates: CourseUpdate[] = [];
  allCourses.forEach(c => {
    if (c.updates) allUpdates.push(...c.updates);
  });

  const counts = {
    all: allNotifications.length + allUpdates.length,
    grades: allNotifications.filter(n => n.category === 'Grades & Marks').length + 
            allUpdates.filter(u => u.category === 'Grades & Marks').length,
    viva: allNotifications.filter(n => n.category === 'Viva & Exam').length + 
          allUpdates.filter(u => u.category === 'Viva & Exam').length,
    deadlines: allNotifications.filter(n => n.category === 'Deadlines & Quizzes').length + 
               allUpdates.filter(u => u.category === 'Deadlines & Quizzes').length,
    courses: allCourses.length,
  };

  // Filtered Notifications for Dashboard View
  const filteredNotifications = allNotifications.filter((n) => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.course_code && n.course_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.course_name && n.course_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (activeTab === 'All') return true;
    if (activeTab === 'Courses') return false;
    return n.category === activeTab;
  });

  // Filtered Courses & Updates for Dashboard View
  const filteredCourses = allCourses.map((c) => {
    const filteredUpdates = (c.updates || []).filter((u) => {
      const matchesSearch = 
        u.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      if (activeTab === 'All' || activeTab === 'Courses') return true;
      return u.category === activeTab;
    });

    return {
      ...c,
      updates: filteredUpdates,
      updates_count: filteredUpdates.length,
    };
  }).filter((c) => {
    if (activeTab === 'Courses') {
      return (
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return c.updates && c.updates.length > 0;
  });

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-[#18181B]">
      {/* Top Navigation Header */}
      <Header
        isSyncing={isSyncing}
        onSync={handleSyncNow}
        onOpenSchedule={() => setIsScheduleOpen(true)}
        onToggleDrawer={() => {
          setIsDrawerOpen(true);
          setIsDrawerMinimized(false);
        }}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        hasLogs={syncLogs.length > 0}
        settings={settings}
        lastSyncedAt={data?.synced_at}
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        announcementsCount={announcements24hCount > 0 ? announcements24hCount : announcements7dCount}
      />

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
        <div className="flex items-start gap-6 lg:gap-8">
          {/* Left Column: Persistent Sidebar Navigation */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            counts={counts}
            onOpenSchedule={() => setIsScheduleOpen(true)}
            onToggleDrawer={() => {
              setIsDrawerOpen(true);
              setIsDrawerMinimized(false);
            }}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            activeView={activeView}
            onSelectView={setActiveView}
            announcementsCount={announcements24hCount > 0 ? announcements24hCount : announcements7dCount}
          />

          {/* Right Column: Main Content Canvas */}
          <main className="flex-1 min-w-0 space-y-5">
            {activeView === 'Announcements' ? (
              /* ========================================================================= */
              /* ANNOUNCEMENTS VIEW (Last 7 Days / Last 24 Hours with interactive toggle)  */
              /* ========================================================================= */
              <div className="space-y-5">
                {/* Announcements Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#EAEAE5] p-5 sm:p-6 rounded-2xl shadow-refero-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-[#18181B]" />
                      <h1 className="text-[17px] sm:text-[18px] font-semibold text-[#18181B] tracking-tight">
                        Announcements & Broadcasts
                      </h1>
                    </div>
                    <p className="text-[12.5px] sm:text-[13px] text-[#71717A] mt-1">
                      Recent notices and updates from course forums and your OUSL portal.
                    </p>
                  </div>

                  {/* 24h / 7d Timeframe Toggle */}
                  <div className="flex items-center p-1 bg-black/[0.05] rounded-xl self-start sm:self-auto select-none">
                    <button
                      onClick={() => setTimeframe('24h')}
                      className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 ${
                        timeframe === '24h'
                          ? 'bg-white text-[#18181B] shadow-refero-sm'
                          : 'text-[#71717A] hover:text-[#18181B]'
                      }`}
                    >
                      <span>Last 24 Hours</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                          timeframe === '24h'
                            ? 'bg-[#18181B] text-white'
                            : 'bg-black/[0.08] text-[#71717A]'
                        }`}
                      >
                        {announcements24hCount}
                      </span>
                    </button>

                    <button
                      onClick={() => setTimeframe('7d')}
                      className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 ${
                        timeframe === '7d'
                          ? 'bg-white text-[#18181B] shadow-refero-sm'
                          : 'text-[#71717A] hover:text-[#18181B]'
                      }`}
                    >
                      <span>Last 7 Days</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                          timeframe === '7d'
                            ? 'bg-[#18181B] text-white'
                            : 'bg-black/[0.08] text-[#71717A]'
                        }`}
                      >
                        {announcements7dCount}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Search Bar for Announcements */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="text-[13px] font-semibold text-[#18181B]">
                    Showing {filteredAnnouncements.length} {filteredAnnouncements.length === 1 ? 'announcement' : 'announcements'} from the {timeframe === '24h' ? 'last 24 hours' : 'last 7 days'}
                  </div>

                  <div className="relative min-w-[240px] sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                    <input
                      type="text"
                      placeholder="Filter announcements..."
                      value={announcementSearchQuery}
                      onChange={(e) => setAnnouncementSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-1.5 text-[13px] bg-white rounded-lg border border-black/[0.08] shadow-refero-sm focus:outline-none focus:ring-1 focus:ring-black/20 transition-all placeholder:text-[#71717A]"
                    />
                  </div>
                </div>

                {/* Announcements Content List */}
                {loading ? (
                  <div className="p-16 text-center text-[#71717A] flex flex-col items-center justify-center gap-2 bg-[#EAEAE5] rounded-2xl">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#18181B]" />
                    <p className="text-[13.5px] font-medium text-[#18181B]">
                      Loading announcements...
                    </p>
                  </div>
                ) : filteredAnnouncements.length > 0 ? (
                  <div className="bg-[#EAEAE5] rounded-2xl divide-y divide-black/[0.04] overflow-hidden shadow-refero-sm">
                    {filteredAnnouncements.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 sm:gap-4 hover:bg-black/[0.015] transition-colors group"
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          {/* Course Code Badge */}
                          <div className="px-2.5 py-1 rounded-lg bg-[#18181B] text-white font-mono font-semibold text-[11.5px] tracking-wide shrink-0 shadow-refero-sm mt-0.5 sm:mt-0">
                            {item.courseCode}
                          </div>

                          {/* Content Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[13.5px] sm:text-[14px] font-semibold text-[#18181B] hover:text-black hover:underline transition-colors leading-snug break-words"
                              >
                                {item.title}
                              </a>
                              {item.isNew && (
                                <span className="px-1.5 py-0.2 text-[10.5px] font-semibold bg-blue-100 text-blue-800 rounded-md">
                                  New
                                </span>
                              )}
                            </div>

                            <div className="text-[12px] text-[#71717A] flex items-center gap-2 mt-1 flex-wrap">
                              <span className="font-medium text-[#18181B] truncate max-w-[200px] sm:max-w-sm">
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
                                    <User className="w-3 h-3 text-[#8E8E93]" />
                                    {item.author}
                                  </span>
                                </>
                              )}
                              {item.time && (
                                <>
                                  <span>&bull;</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[#8E8E93]" />
                                    {item.time}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Open Button */}
                        <div className="shrink-0">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-[#18181B] bg-white hover:bg-[#F9F9F7] border border-black/[0.08] rounded-lg shadow-refero-sm transition-all"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3 text-[#71717A]" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="p-16 text-center bg-[#EAEAE5] rounded-2xl text-[#71717A] space-y-2">
                    <Bell className="w-8 h-8 mx-auto text-[#71717A]" />
                    <h3 className="text-[15px] font-semibold text-[#18181B]">
                      No announcements in the {timeframe === '24h' ? 'last 24 hours' : 'last 7 days'}
                    </h3>
                    <p className="text-[12.5px] max-w-sm mx-auto leading-relaxed">
                      {timeframe === '24h'
                        ? 'No announcements were posted in the last 24 hours. Switch to "Last 7 Days" to review earlier updates.'
                        : 'No announcements were found for the last 7 days.'}
                    </p>
                    {timeframe === '24h' && announcements7dCount > 0 && (
                      <div className="pt-2">
                        <button
                          onClick={() => setTimeframe('7d')}
                          className="px-4 py-1.5 bg-white text-[#18181B] border border-black/[0.08] rounded-lg text-[12.5px] font-medium hover:bg-[#F9F9F7] shadow-refero-sm transition-all"
                        >
                          View Last 7 Days ({announcements7dCount})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ========================================================================= */
              /* DASHBOARD / OVERVIEW VIEW (Filtered Feeds)                                */
              /* ========================================================================= */
              <div className="space-y-4 sm:space-y-5">
                {/* Search Bar & Active Filter Label */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#18181B]">
                      {activeTab === 'All'
                        ? 'All Academic Feeds'
                        : activeTab === 'Courses'
                        ? 'Enrolled Courses'
                        : activeTab}
                    </span>
                    {activeTab !== 'All' && (
                      <button
                        onClick={() => setActiveTab('All')}
                        className="text-[11.5px] text-[#71717A] hover:text-[#18181B] hover:underline"
                      >
                        (Clear filter)
                      </button>
                    )}
                  </div>

                  <div className="relative min-w-[240px] sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                    <input
                      type="text"
                      placeholder="Search announcements, CATs, vivas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-1.5 text-[13px] bg-white rounded-lg border border-black/[0.08] shadow-refero-sm focus:outline-none focus:ring-1 focus:ring-black/20 transition-all placeholder:text-[#71717A]"
                    />
                  </div>
                </div>

                {/* Content Feed Section */}
                {loading ? (
                  <div className="p-16 text-center text-[#71717A] flex flex-col items-center justify-center gap-2 bg-[#EAEAE5] rounded-2xl">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#18181B]" />
                    <p className="text-[13.5px] font-medium text-[#18181B]">
                      Loading academic updates...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 1. Portal Notifications & System Alerts Group */}
                    {activeTab !== 'Courses' && filteredNotifications.length > 0 && (
                      <div className="bg-[#EAEAE5] rounded-2xl divide-y divide-black/[0.04] overflow-hidden shadow-refero-sm">
                        {filteredNotifications.map((notif) => (
                          <NotificationCard key={notif.id} notification={notif} />
                        ))}
                      </div>
                    )}

                    {/* 2. Course Announcements & Discussions Group */}
                    {filteredCourses.length > 0 ? (
                      <div className="bg-[#EAEAE5] rounded-2xl divide-y divide-black/[0.04] overflow-hidden shadow-refero-sm">
                        {filteredCourses.map((course) => (
                          <CourseCard
                            key={course.id}
                            course={course}
                            defaultExpanded={activeTab !== 'Courses' && filteredCourses.length <= 3}
                          />
                        ))}
                      </div>
                    ) : filteredNotifications.length === 0 ? (
                      <div className="p-12 text-center bg-[#EAEAE5] rounded-2xl text-[#71717A]">
                        <BookOpen className="w-7 h-7 mx-auto mb-2 text-[#71717A]" />
                        <p className="text-[14px] font-semibold text-[#18181B]">
                          No updates matching your filter
                        </p>
                        <p className="text-[12px] mt-0.5">
                          Try searching with a different term or select another category from the sidebar.
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
    </div>
  );
}


