'use client';

import React from 'react';
import { RefreshCw, Clock, Activity } from 'lucide-react';

interface CalloutBannerProps {
  isSyncing: boolean;
  onSync: () => void;
  onOpenSchedule: () => void;
  onToggleDrawer: () => void;
  hasLogs: boolean;
  currentMessage?: string;
  progress?: number;
}

export function CalloutBanner({
  isSyncing,
  onSync,
  onOpenSchedule,
  onToggleDrawer,
  hasLogs,
  currentMessage,
  progress = 0,
}: CalloutBannerProps) {
  return (
    <div className="bg-[#f2ebe5] rounded-2xl p-6 sm:p-8 text-center transition-all select-none">
      <h3 className="text-[14.5px] sm:text-[15px] font-semibold text-[#4e080c] mb-1">
        Academic Sync & Background Scraper
      </h3>
      <p className="text-[12.5px] sm:text-[13px] text-[#71717A] max-w-lg mx-auto mb-5 leading-relaxed">
        {isSyncing
          ? currentMessage || 'Connecting to OUSL Keycloak server...'
          : 'Accelerate your studies with automated headless crawling, real-time Keycloak IAM authentication, and instant forum updates.'}
      </p>

      {isSyncing ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-xs h-1.5 bg-[#4e080c]/[0.12] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4e080c] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={onToggleDrawer}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-[#4e080c] bg-white hover:bg-[#f5efe9] border border-[#4e080c]/[0.12] rounded-lg shadow-refero-sm"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse text-[#4e080c]" />
              <span>View Logs ({progress}%)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#4e080c] hover:bg-[#620a0f] rounded-lg shadow-refero-sm active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Now</span>
          </button>

          <button
            onClick={onOpenSchedule}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-[#4e080c] bg-white hover:bg-[#f5efe9] border border-[#4e080c]/[0.12] rounded-lg shadow-refero-sm active:scale-[0.98] transition-all"
          >
            <Clock className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Schedule</span>
          </button>
        </div>
      )}
    </div>
  );
}
