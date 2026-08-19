'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { CategoryTabs, CategoryFilter } from '@/components/CategoryTabs';
import { StatsOverview } from '@/components/StatsOverview';
import { NotificationCard } from '@/components/NotificationCard';
import { CourseCard } from '@/components/CourseCard';
import { ScheduleModal } from '@/components/ScheduleModal';
import { SyncProgressDrawer, SyncLogItem } from '@/components/SyncProgressDrawer';
import { LMSDataPayload, UserSettings, NotificationItem, CourseUpdate } from '@/lib/types';
import { Search, RefreshCw, BookOpen } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<LMSDataPayload | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

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
    <div className="min-h-screen pb-20">
      <Header
        isSyncing={isSyncing}
        onSync={handleSyncNow}
        onOpenSchedule={() => setIsScheduleOpen(true)}
        onToggleDrawer={() => {
          setIsDrawerOpen(true);
          setIsDrawerMinimized(false);
        }}
        hasLogs={syncLogs.length > 0}
        settings={settings}
        lastSyncedAt={data?.synced_at}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Top Metric Cards */}
        <StatsOverview
          totalCourses={data?.stats?.total_courses || 0}
          totalNotifications={data?.stats?.total_notifications || 0}
          totalUpdates={data?.stats?.total_updates || 0}
          durationSeconds={data?.duration_seconds}
        />

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <CategoryTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            counts={counts}
          />

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
            <input
              type="text"
              placeholder="Search announcements, CATs, vivas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-1.5 text-[13.5px] bg-white/80 backdrop-blur-md rounded-xl border border-black/[0.08] shadow-apple-sm focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all placeholder:text-[#86868B]"
            />
          </div>
        </div>

        {/* Content Feeds */}
        {loading ? (
          <div className="p-12 text-center text-[#86868B] flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0071E3]" />
            <p className="text-[14px]">Loading your academic updates...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Portal Notifications Section */}
            {activeTab !== 'Courses' && filteredNotifications.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold text-[#86868B] uppercase tracking-wider">
                    Portal Alerts & System Notices ({filteredNotifications.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredNotifications.map((notif) => (
                    <NotificationCard key={notif.id} notification={notif} />
                  ))}
                </div>
              </section>
            )}

            {/* 2. Course Announcements Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-[#86868B] uppercase tracking-wider">
                  {activeTab === 'Courses' ? 'Enrolled Courses' : 'Course Announcements & Discussions'} ({filteredCourses.length})
                </h2>
              </div>

              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      defaultExpanded={activeTab !== 'Courses'}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-white/60 rounded-2xl border border-black/[0.04] text-[#86868B]">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-[#86868B]/60" />
                  <p className="text-[14px] font-medium text-[#1D1D1F]">No updates matching your filter</p>
                  <p className="text-[12px] mt-0.5">Try searching with a different term or change the category.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Schedule Settings Modal */}
      {settings && (
        <ScheduleModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          settings={settings}
          onSave={handleSaveSettings}
        />
      )}

      {/* Live Sync Progress Drawer (Slide-over from right with minimize support) */}
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
