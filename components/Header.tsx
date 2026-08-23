'use client';

import React, { useState } from 'react';
import {
  RefreshCw,
  Clock,
  Activity,
  Bell,
  LayoutDashboard,
  User,
  Settings,
  Key,
  ShieldCheck,
  ExternalLink,
  X,
  ChevronRight,
  Layers,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { UserSettings } from '@/lib/types';
import { useTheme } from '@/lib/themeContext';

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
  hasLogs,
  settings,
  lastSyncedAt,
  activeView = 'Dashboard',
  onSelectView,
  announcementsCount = 0,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const portalLoginUrl = 'https://oulms.ou.ac.lk/login/index.php';
  const studentUsername = settings?.ousl_username;
  const displayStudent = studentUsername ? studentUsername.split('@')[0] : 'OUSL Student';

  return (
    <>
      <header className="w-full bg-[#fbf8f5] dark:bg-[#0f0f11]/95 px-4 sm:px-8 lg:px-10 py-2.5 sm:py-4 flex items-center justify-between transition-all select-none border-b border-[#4e080c]/[0.06] dark:border-white/[0.08] ios-safe-top sticky top-0 z-30 backdrop-blur-md bg-[#fbf8f5]/95">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div
            onClick={() => onSelectView?.('Dashboard')}
            className="flex items-center gap-2 cursor-pointer active:opacity-80 transition-opacity"
          >
            <svg
              className="w-6 h-6 text-[#4e080c] dark:text-[#f4f4f5]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2ZM12 4.15L19.5 8.35L16.2 10.15L12 7.85L7.8 10.15L4.5 8.35L12 4.15ZM4 9.85L11 13.7V20.15L4 16.3V9.85ZM13 20.15V13.7L20 9.85V16.3L13 20.15Z" />
            </svg>
            <span className="text-[14.5px] sm:text-[15px] font-semibold text-[#4e080c] dark:text-[#f4f4f5] tracking-tight">
              OUSL Digest
            </span>
          </div>

          {/* Desktop-only Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#4e080c]/[0.05] dark:bg-white/[0.06] p-1 rounded-xl" aria-label="Desktop Navigation">
            <button
              onClick={() => onSelectView?.('Dashboard')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5 min-h-[36px] ${
                activeView === 'Dashboard'
                  ? 'bg-white dark:bg-[#18181b] text-[#4e080c] dark:text-[#f4f4f5] shadow-refero-sm'
                  : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.02] dark:hover:bg-white/[0.04]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => onSelectView?.('Announcements')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5 min-h-[36px] ${
                activeView === 'Announcements'
                  ? 'bg-white dark:bg-[#18181b] text-[#4e080c] dark:text-[#f4f4f5] shadow-refero-sm'
                  : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.02] dark:hover:bg-white/[0.04]'
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
          {/* Theme Toggle Button (Desktop & Tablet) */}
          <button
            onClick={toggleTheme}
            className="hidden sm:inline-flex min-w-[38px] min-h-[38px] items-center justify-center rounded-xl bg-white dark:bg-[#18181b] text-[#4e080c] dark:text-[#f4f4f5] border border-[#4e080c]/[0.12] dark:border-white/[0.12] shadow-refero-sm hover:bg-[#f5efe9] dark:hover:bg-[#27272a] active:scale-95 transition-all p-2"
            title={`Current: ${resolvedTheme === 'dark' ? 'Dark' : 'Light'} Mode. Click to toggle.`}
            aria-label={`Toggle theme (${resolvedTheme === 'dark' ? 'Dark' : 'Light'} Mode active)`}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#4e080c]" />
            )}
          </button>

          {/* Mobile Alerts Bell Button */}
          <button
            onClick={() => onSelectView?.('Announcements')}
            className={`md:hidden relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
              activeView === 'Announcements'
                ? 'bg-[#4e080c] text-white border-[#4e080c]'
                : 'bg-white dark:bg-[#18181b] text-[#4e080c] dark:text-[#f4f4f5] border-[#4e080c]/[0.12] dark:border-white/[0.12] shadow-refero-sm hover:bg-[#f5efe9] dark:hover:bg-[#27272a]'
            }`}
            aria-label={`Announcements and notifications (${announcementsCount} updates)`}
            title="Announcements & Alerts"
          >
            <Bell className="w-4 h-4" />
            {announcementsCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 text-[9.5px] rounded-full flex items-center justify-center font-bold shadow-refero-sm ${
                  activeView === 'Announcements'
                    ? 'bg-white text-[#4e080c]'
                    : 'bg-[#4e080c] text-white'
                }`}
              >
                {announcementsCount > 99 ? '99+' : announcementsCount}
              </span>
            )}
          </button>

          {/* Desktop Crawler Activity / Logs Button */}
          {hasLogs && onToggleDrawer && (
            <button
              onClick={onToggleDrawer}
              className="text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] transition-colors hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[#4e080c]/[0.04] dark:hover:bg-white/[0.06] min-h-[38px]"
              title="Open Crawler Activity Logs"
              aria-label="Open Crawler Activity Logs"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[12.5px]">Logs</span>
            </button>
          )}

          {/* Desktop Sync Schedule Button */}
          {onOpenSchedule && (
            <button
              onClick={onOpenSchedule}
              className="hidden md:inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#4e080c] dark:text-[#f4f4f5] bg-white dark:bg-[#18181b] hover:bg-[#f5efe9] dark:hover:bg-[#27272a] border border-[#4e080c]/[0.12] dark:border-white/[0.12] rounded-lg shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px] min-w-[44px]"
              title="Configure Automatic Sync Schedule"
              aria-label="Configure Sync Schedule"
            >
              <Clock className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              <span>Schedule</span>
            </button>
          )}

          {/* Sync Now Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-[12.5px] sm:text-[13px] font-medium text-white bg-[#4e080c] hover:bg-[#620a0f] active:bg-[#380407] rounded-xl shadow-refero-sm active:scale-[0.98] transition-all disabled:opacity-80 min-h-[44px]"
            aria-label={isSyncing ? 'Sync in progress' : 'Sync latest LMS data now'}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            <span className="sm:hidden">{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* Mobile Profile & Settings Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-[#18181b] text-[#4e080c] dark:text-[#f4f4f5] border border-[#4e080c]/[0.12] dark:border-white/[0.12] shadow-refero-sm hover:bg-[#f5efe9] dark:hover:bg-[#27272a] active:scale-95 transition-all relative"
            aria-label="Settings & Account Menu"
            title="Settings & Account Menu"
          >
            <Settings className="w-4 h-4 text-[#4e080c] dark:text-[#f4f4f5]" />
            {studentUsername && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#18181b]" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Profile & Settings Bottom Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs select-none md:hidden">
          {/* Backdrop click to dismiss */}
          <div className="fixed inset-0" onClick={() => setIsMobileMenuOpen(false)} />

          <div className="relative w-full bg-[#fbf8f5] dark:bg-[#18181b] rounded-t-3xl border-t border-[#4e080c]/[0.12] dark:border-white/[0.12] shadow-refero-lg overflow-hidden p-5 sm:p-6 ios-safe-bottom animate-slide-in-up z-10 space-y-4">
            {/* Grabber Bar */}
            <div className="w-10 h-1 bg-[#4e080c]/20 dark:bg-white/20 rounded-full mx-auto mb-2" />

            {/* User Profile Header Card */}
            <div className="p-4 rounded-2xl bg-[#f2ebe5] dark:bg-[#222226] border border-[#4e080c]/[0.06] dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4e080c] text-white flex items-center justify-center shadow-refero-sm font-semibold text-[14px]">
                  {displayStudent.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-[#4e080c] dark:text-[#f4f4f5] text-[14.5px]">
                    {displayStudent}
                  </div>
                  <p className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa]">
                    {studentUsername ? 'OUSL Student Account' : 'Credentials Not Set'}
                  </p>
                </div>
              </div>

              <a
                href={portalLoginUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-[#4e080c]/[0.08] dark:border-white/[0.12] text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] transition-colors"
                title="Open OUSL Moodle Portal"
                aria-label="Open OUSL Moodle Portal"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Appearance / Theme Selector */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#222226] border border-[#4e080c]/[0.08] dark:border-white/[0.08] space-y-2">
              <div className="text-[12px] font-semibold text-[#4e080c] dark:text-[#f4f4f5] flex items-center justify-between">
                <span>Theme / Appearance</span>
                <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa] font-normal capitalize">
                  {theme === 'system' ? `System (${resolvedTheme})` : `${theme} Mode`}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f2ebe5] dark:bg-[#18181b] rounded-xl">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all ${
                    theme === 'light'
                      ? 'bg-white dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] shadow-refero-sm font-semibold'
                      : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] shadow-refero-sm font-semibold'
                      : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all ${
                    theme === 'system'
                      ? 'bg-white dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] shadow-refero-sm font-semibold'
                      : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c]'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Auto</span>
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-2">
              {/* Account Credentials & IAM */}
              <button
                onClick={() => {
                  onSelectView?.('Account');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#222226] hover:bg-[#f5efe9] dark:hover:bg-[#27272a] active:bg-[#ede3da] border border-[#4e080c]/[0.08] dark:border-white/[0.08] text-left transition-all min-h-[50px] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#4e080c]/[0.05] dark:bg-white/[0.08] text-[#4e080c] dark:text-[#f4f4f5] flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">
                      Account Credentials & IAM
                    </div>
                    <div className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa]">
                      Configure student ID and password
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              </button>

              {/* Course Whitelist Manager */}
              <button
                onClick={() => {
                  onSelectView?.('Account');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#222226] hover:bg-[#f5efe9] dark:hover:bg-[#27272a] active:bg-[#ede3da] border border-[#4e080c]/[0.08] dark:border-white/[0.08] text-left transition-all min-h-[50px] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#4e080c]/[0.05] dark:bg-white/[0.08] text-[#4e080c] dark:text-[#f4f4f5] flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">
                      Course Whitelist Manager
                    </div>
                    <div className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa]">
                      Select courses to crawl and index
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              </button>

              {/* Daily Crawl Schedule */}
              {onOpenSchedule && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSchedule();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#222226] hover:bg-[#f5efe9] dark:hover:bg-[#27272a] active:bg-[#ede3da] border border-[#4e080c]/[0.08] dark:border-white/[0.08] text-left transition-all min-h-[50px] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4e080c]/[0.05] dark:bg-white/[0.08] text-[#4e080c] dark:text-[#f4f4f5] flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">
                        Daily Crawl Schedule
                      </div>
                      <div className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa]">
                        Automated 3x daily indexing times
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
                </button>
              )}

              {/* Live Crawler Logs */}
              {onToggleDrawer && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onToggleDrawer();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#222226] hover:bg-[#f5efe9] dark:hover:bg-[#27272a] active:bg-[#ede3da] border border-[#4e080c]/[0.08] dark:border-white/[0.08] text-left transition-all min-h-[50px] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4e080c]/[0.05] dark:bg-white/[0.08] text-[#4e080c] dark:text-[#f4f4f5] flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">
                        Live Crawler Logs
                      </div>
                      <div className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa]">
                        Real-time Playwright execution feed
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
                </button>
              )}
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 rounded-2xl bg-[#4e080c]/[0.08] dark:bg-white/[0.08] hover:bg-[#4e080c]/[0.12] dark:hover:bg-white/[0.12] active:bg-[#4e080c]/[0.18] text-[#4e080c] dark:text-[#f4f4f5] font-semibold text-[13.5px] transition-all min-h-[44px]"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


