'use client';

import React from 'react';
import { RefreshCw, Activity, Menu } from 'lucide-react';
import { UserSettings } from '@/lib/types';

interface HeaderProps {
  isSyncing: boolean;
  onSync: () => void;
  onOpenSchedule: () => void;
  onToggleDrawer: () => void;
  onToggleMobileSidebar?: () => void;
  hasLogs: boolean;
  settings: UserSettings | null;
  lastSyncedAt?: string;
  activeView?: string;
  onSelectView?: (view: string) => void;
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
    <header className="w-full bg-[#F4F4F0] px-6 sm:px-10 py-5 flex items-center justify-between transition-all select-none">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1.5 -ml-2 text-[#71717A] hover:text-[#18181B] rounded-lg hover:bg-black/[0.04] transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Minimalist Geometric Logo (Like in the reference image) */}
        <div className="flex items-center gap-2.5">
          <svg
            className="w-6 h-6 text-[#18181B]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2ZM12 4.15L19.5 8.35L16.2 10.15L12 7.85L7.8 10.15L4.5 8.35L12 4.15ZM4 9.85L11 13.7V20.15L4 16.3V9.85ZM13 20.15V13.7L20 9.85V16.3L13 20.15Z" />
          </svg>
          <span className="text-[14px] font-semibold text-[#18181B] tracking-tight hidden sm:inline-block">
            OUSL Digest
          </span>
        </div>
      </div>

      {/* Right Navigation & Profile Section */}
      <div className="flex items-center gap-6 text-[13.5px]">
        <nav className="flex items-center gap-5">
          <button
            onClick={() => onSelectView?.('Feeds')}
            className={`transition-colors ${
              activeView === 'Feeds'
                ? 'font-semibold text-[#18181B]'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            Announcements
          </button>
          <button
            onClick={() => onSelectView?.('Dashboard')}
            className={`transition-colors ${
              activeView === 'Dashboard'
                ? 'font-semibold text-[#18181B]'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            Dashboard
          </button>
          {hasLogs && (
            <button
              onClick={onToggleDrawer}
              className="text-[#71717A] hover:text-[#18181B] transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Crawler Logs</span>
            </button>
          )}
        </nav>

        {/* User / Student Avatar Pill */}
        <div
          title={`Last synced: ${formatTimeAgo(lastSyncedAt)}`}
          className="w-7 h-7 rounded-full bg-white border border-black/[0.12] text-[#18181B] text-[11px] font-semibold flex items-center justify-center cursor-default shadow-refero-sm"
        >
          OU
        </div>
      </div>
    </header>
  );
}

