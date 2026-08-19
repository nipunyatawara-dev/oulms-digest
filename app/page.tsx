'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { CategoryFilter } from '@/components/CategoryTabs';
import { StatsOverview } from '@/components/StatsOverview';
import { CalloutBanner } from '@/components/CalloutBanner';
import { NotificationCard } from '@/components/NotificationCard';
import { CourseCard } from '@/components/CourseCard';
import { ScheduleModal } from '@/components/ScheduleModal';
import { SyncProgressDrawer, SyncLogItem } from '@/components/SyncProgressDrawer';
import { LMSDataPayload, UserSettings, NotificationItem, CourseUpdate } from '@/lib/types';
import { Search, RefreshCw, BookOpen, Layers, Bell } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<LMSDataPayload | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'Dashboard' | 'Feeds'>('Dashboard');

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

  // Filter calculations
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

  // Filtered Notifications
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

  // Filtered Courses & Updates
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
      {/* Minimalist Top Navigation Header */}
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
        onSelectView={(v) => setActiveView(v as 'Dashboard' | 'Feeds')}
      />

      {/* Main Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-6">
        <div className="flex items-start gap-6 lg:gap-8">
          {/* Left Column: Sidebar Navigation */}
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
          />

          {/* Right Column: Main Dashboard Content Canvas */}
          <main className="flex-1 min-w-0 space-y-4 sm:space-y-5">
            {/* Top 3 Plan-style Cards (Pro / Pro+ / Ultra layout) */}
            <StatsOverview
              totalCourses={data?.stats?.total_courses || 0}
              totalNotifications={data?.stats?.total_notifications || 0}
              totalUpdates={data?.stats?.total_updates || 0}
              gradesCount={counts.grades}
              vivaCount={counts.viva}
              deadlinesCount={counts.deadlines}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            />

            {/* Middle Centered Callout Banner (Invite Team Members layout) */}
            <CalloutBanner
              isSyncing={isSyncing}
              onSync={handleSyncNow}
              onOpenSchedule={() => setIsScheduleOpen(true)}
              onToggleDrawer={() => {
                setIsDrawerOpen(true);
                setIsDrawerMinimized(false);
              }}
              hasLogs={syncLogs.length > 0}
              currentMessage={currentSyncMessage}
              progress={syncProgress}
            />

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

            {/* Content Feed Section (Refero Integration List style) */}
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

