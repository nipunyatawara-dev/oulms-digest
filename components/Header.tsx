'use client';

import React from 'react';
import { RefreshCw, Clock, Activity, Menu, Bell, LayoutDashboard } from 'lucide-react';
import { UserSettings } from '@/lib/types';

interface HeaderProps {
  isSyncing: boolean;
  onSync: () => void;
  onOpenSchedule?: () => void;
  onToggleDrawer?: () => void;
  onToggleMobileSidebar?: () => void;
  hasLogs?: boolean;
  settings?: UserSettings | null;
  lastSyncedAt?: string;
  activeView?: 'Dashboard' | 'Announcements' | 'Account';
  onSelectView?: (view: 'Dashboard' | 'Announcements' | 'Account') => void;
  announcementsCount?: number;
}

export function Header({
  isSyncing,
  onSync,
  onOpenSchedule,
  onToggleDrawer,
  onToggleMobileSidebar,
  hasLogs,
  settings,
  lastSyncedAt,
  activeView = 'Dashboard',
  onSelectView,
  announcementsCount = 0,
}: HeaderProps) {
  const formatTimeAgo = (timestamp?: string) => {
    if (!timestamp) return 'Never synced';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <header className="w-full bg-[#fbf8f5] px-4 sm:px-8 lg:px-10 py-3 sm:py-4 flex items-center justify-between transition-all select-none border-b border-[#4e080c]/[0.06] ios-safe-top sticky top-0 z-30 backdrop-blur-sm bg-[#fbf8f5]/95">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2.5">
          <svg
            className="w-6 h-6 text-[#4e080c]"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2ZM12 4.15L19.5 8.35L16.2 10.15L12 7.85L7.8 10.15L4.5 8.35L12 4.15ZM4 9.85L11 13.7V20.15L4 16.3V9.85ZM13 20.15V13.7L20 9.85V16.3L13 20.15Z" />
          </svg>
          <span className="text-[14.5px] sm:text-[15px] font-semibold text-[#4e080c] tracking-tight">
            OUSL Digest
          </span>
        </div>

        {/* Center / Desktop-only Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#4e080c]/[0.05] p-1 rounded-xl" aria-label="Desktop Navigation">
          <button
            onClick={() => onSelectView?.('Dashboard')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5 min-h-[36px] ${
              activeView === 'Dashboard'
                ? 'bg-white text-[#4e080c] shadow-refero-sm'
                : 'text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.02]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => onSelectView?.('Announcements')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5 min-h-[36px] ${
              activeView === 'Announcements'
                ? 'bg-white text-[#4e080c] shadow-refero-sm'
                : 'text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.02]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Announcements</span>
            {announcementsCount > 0 && (
              <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-[#4e080c] text-white font-semibold">
                {announcementsCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5 text-[13px]">
        {/* Crawler Activity / Logs Button (Desktop) */}
        {hasLogs && onToggleDrawer && (
          <button
            onClick={onToggleDrawer}
            className="text-[#71717A] hover:text-[#4e080c] transition-colors hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[#4e080c]/[0.04] min-h-[38px]"
            title="Open Crawler Activity Logs"
            aria-label="Open Crawler Activity Logs"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[12.5px]">Logs</span>
          </button>
        )}

        {/* Sync Schedule Button */}
        {onOpenSchedule && (
          <button
            onClick={onOpenSchedule}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#4e080c] bg-white hover:bg-[#f5efe9] border border-[#4e080c]/[0.12] rounded-lg shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px] min-w-[44px]"
            title="Configure Automatic Sync Schedule"
            aria-label="Configure Sync Schedule"
          >
            <Clock className="w-4 h-4 text-[#71717A]" />
            <span className="hidden sm:inline">Schedule</span>
          </button>
        )}

        {/* Sync Now Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 text-[13px] font-medium text-white bg-[#4e080c] hover:bg-[#620a0f] rounded-lg shadow-refero-sm active:scale-[0.98] transition-all disabled:opacity-80 min-h-[44px]"
          aria-label={isSyncing ? 'Sync in progress' : 'Sync latest LMS data now'}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="text-[13px]">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>
    </header>
  );
}


