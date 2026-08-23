'use client';

import React from 'react';
import { LayoutDashboard, Bell, BookOpen, Key } from 'lucide-react';
import { CategoryFilter } from '@/components/CategoryTabs';

interface MobileTabBarProps {
  activeView: 'Dashboard' | 'Announcements' | 'Account';
  activeTab: CategoryFilter;
  onSelectView: (view: 'Dashboard' | 'Announcements' | 'Account') => void;
  onSelectTab: (tab: CategoryFilter) => void;
  announcementsCount?: number;
  hasCredentials?: boolean;
}

export function MobileTabBar({
  activeView,
  activeTab,
  onSelectView,
  onSelectTab,
  announcementsCount = 0,
  hasCredentials = false,
}: MobileTabBarProps) {
  const isOverviewActive = activeView === 'Dashboard' && activeTab !== 'Courses';
  const isAnnouncementsActive = activeView === 'Announcements';
  const isCoursesActive = activeView === 'Dashboard' && activeTab === 'Courses';
  const isAccountActive = activeView === 'Account';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fbf8f5]/95 backdrop-blur-md border-t border-[#4e080c]/[0.08] ios-safe-bottom select-none transition-all shadow-[0_-2px_10px_rgba(78,8,12,0.03)]"
      role="tablist"
      aria-label="Main Navigation"
    >
      <div className="flex items-center justify-around h-[52px] max-w-lg mx-auto px-2">
        {/* Tab 1: Overview Feed */}
        <button
          onClick={() => {
            onSelectView('Dashboard');
            onSelectTab('All');
          }}
          role="tab"
          aria-selected={isOverviewActive}
          aria-label="Overview academic feed"
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-all active:scale-95 ${
            isOverviewActive
              ? 'text-[#4e080c] font-semibold'
              : 'text-[#71717A] hover:text-[#4e080c]'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-[20px] h-[20px] transition-transform ${isOverviewActive ? 'scale-110 text-[#4e080c]' : ''}`} />
          </div>
          <span className="text-[10.5px] mt-1 tracking-tight leading-none">
            Overview
          </span>
        </button>

        {/* Tab 2: Alerts & Announcements */}
        <button
          onClick={() => onSelectView('Announcements')}
          role="tab"
          aria-selected={isAnnouncementsActive}
          aria-label={`Announcements and alerts (${announcementsCount} updates)`}
          className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-all active:scale-95 ${
            isAnnouncementsActive
              ? 'text-[#4e080c] font-semibold'
              : 'text-[#71717A] hover:text-[#4e080c]'
          }`}
        >
          <div className="relative">
            <Bell className={`w-[20px] h-[20px] transition-transform ${isAnnouncementsActive ? 'scale-110 text-[#4e080c]' : ''}`} />
            {announcementsCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-[#4e080c] text-white text-[9.5px] rounded-full flex items-center justify-center font-bold shadow-refero-sm">
                {announcementsCount > 99 ? '99+' : announcementsCount}
              </span>
            )}
          </div>
          <span className="text-[10.5px] mt-1 tracking-tight leading-none">
            Alerts
          </span>
        </button>

        {/* Tab 3: Enrolled Courses */}
        <button
          onClick={() => {
            onSelectView('Dashboard');
            onSelectTab('Courses');
          }}
          role="tab"
          aria-selected={isCoursesActive}
          aria-label="Enrolled registered semester courses"
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-all active:scale-95 ${
            isCoursesActive
              ? 'text-[#4e080c] font-semibold'
              : 'text-[#71717A] hover:text-[#4e080c]'
          }`}
        >
          <div className="relative">
            <BookOpen className={`w-[20px] h-[20px] transition-transform ${isCoursesActive ? 'scale-110 text-[#4e080c]' : ''}`} />
          </div>
          <span className="text-[10.5px] mt-1 tracking-tight leading-none">
            Courses
          </span>
        </button>

        {/* Tab 4: Account Credentials & Settings */}
        <button
          onClick={() => onSelectView('Account')}
          role="tab"
          aria-selected={isAccountActive}
          aria-label="Account credentials and course whitelist settings"
          className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-all active:scale-95 ${
            isAccountActive
              ? 'text-[#4e080c] font-semibold'
              : 'text-[#71717A] hover:text-[#4e080c]'
          }`}
        >
          <div className="relative">
            <Key className={`w-[20px] h-[20px] transition-transform ${isAccountActive ? 'scale-110 text-[#4e080c]' : ''}`} />
            {hasCredentials && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#fbf8f5]" />
            )}
          </div>
          <span className="text-[10.5px] mt-1 tracking-tight leading-none">
            Account
          </span>
        </button>
      </div>
    </nav>
  );
}
