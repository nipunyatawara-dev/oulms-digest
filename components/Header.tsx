'use client';

import React from 'react';
import { RefreshCw, Download, Clock, Activity, LogIn } from 'lucide-react';
import { UserSettings } from '@/lib/types';

interface HeaderProps {
  isSyncing: boolean;
  onSync: () => void;
  onOpenSchedule: () => void;
  onToggleDrawer: () => void;
  hasLogs: boolean;
  settings: UserSettings | null;
  lastSyncedAt?: string;
}

export function Header({
  isSyncing,
  onSync,
  onOpenSchedule,
  onToggleDrawer,
  hasLogs,
  settings,
  lastSyncedAt,
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

  const portalLoginUrl = 'https://oulms.ou.ac.lk/login/index.php';

  const t1 = settings?.time_1 || settings?.morning_time || '07:00';
  const t2 = settings?.time_2 || '16:00';
  const t3 = settings?.time_3 || settings?.evening_time || '22:00';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#F5F5F7]/85 border-b border-black/[0.06] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1D1D1F] to-[#434344] text-white flex items-center justify-center shadow-apple-sm shrink-0">
            <span className="text-[14.5px] font-bold tracking-tight">OU</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] sm:text-[17px] font-semibold text-[#1D1D1F] tracking-tight truncate">
                OUSL LMS Digest
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-[#86868B] truncate hidden sm:block">
              Last synced: {formatTimeAgo(lastSyncedAt)}
              {settings?.auto_sync_enabled && (
                <> &bull; Auto-sync: {t1}, {t2} & {t3}</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 1-Click Login to Portal Button */}
          <a
            href={portalLoginUrl}
            target="_blank"
            rel="noreferrer"
            title="Open OUSL Login page to authenticate your browser session"
            className="apple-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-[#0071E3] bg-[#0071E3]/10 hover:bg-[#0071E3]/15 border border-[#0071E3]/20 rounded-xl shadow-apple-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login to Portal</span>
          </a>

          {hasLogs && (
            <button
              onClick={onToggleDrawer}
              title="View Live Crawler Activity"
              className="apple-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#1D1D1F] bg-white/80 hover:bg-white border border-black/[0.08] rounded-xl shadow-apple-sm"
            >
              <Activity className="w-3.5 h-3.5 text-[#0071E3]" />
              <span className="hidden sm:inline">Activity</span>
            </button>
          )}

          <button
            onClick={onOpenSchedule}
            title="Configure Sync Schedule"
            className="apple-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#1D1D1F] bg-white/80 hover:bg-white border border-black/[0.08] rounded-xl shadow-apple-sm"
          >
            <Clock className="w-3.5 h-3.5 text-[#86868B]" />
            <span className="hidden sm:inline">Schedule</span>
          </button>

          <a
            href="/api/export-pdf"
            target="_blank"
            rel="noreferrer"
            title="Download Academic Batch PDF"
            className="apple-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#1D1D1F] bg-white/80 hover:bg-white border border-black/[0.08] rounded-xl shadow-apple-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#86868B]" />
            <span className="hidden sm:inline">Export PDF</span>
          </a>

          <button
            onClick={onSync}
            disabled={isSyncing}
            className="apple-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-xl shadow-apple-sm disabled:opacity-70"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
