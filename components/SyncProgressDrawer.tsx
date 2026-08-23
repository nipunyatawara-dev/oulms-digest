'use client';

import React, { useEffect, useRef } from 'react';
import { RefreshCw, Minimize2, Maximize2, X, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface SyncLogItem {
  id: string;
  time: string;
  message: string;
  progress: number;
  type?: 'step' | 'done' | 'error';
}

interface SyncProgressDrawerProps {
  isOpen: boolean;
  isMinimized: boolean;
  onMinimize: (minimized: boolean) => void;
  onClose: () => void;
  progress: number;
  currentMessage: string;
  logs: SyncLogItem[];
  isComplete: boolean;
  isError: boolean;
}

export function SyncProgressDrawer({
  isOpen,
  isMinimized,
  onMinimize,
  onClose,
  progress,
  currentMessage,
  logs,
  isComplete,
  isError,
}: SyncProgressDrawerProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen, isMinimized]);

  if (!isOpen) return null;

  // Minimized Floating Pill View
  if (isMinimized) {
    return (
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-4 sm:right-6 z-50 select-none animate-fade-in">
        <button
          onClick={() => onMinimize(false)}
          className="flex items-center gap-3 px-4 py-2.5 bg-[#fbf8f5] rounded-2xl shadow-refero-lg border border-[#4e080c]/[0.12] hover:bg-[#f2ebe5] active:bg-[#ede3da] text-[#4e080c] transition-all min-h-[48px] active:scale-95"
          aria-label={isComplete ? 'Sync complete. View logs' : `Syncing at ${progress}%. View progress logs`}
        >
          <div className="relative flex items-center justify-center">
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <RefreshCw className="w-4 h-4 animate-spin text-[#4e080c]" />
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] font-semibold text-[#4e080c]">
                {isComplete ? 'Sync Complete' : isError ? 'Sync Error' : `Syncing (${progress}%)`}
              </span>
            </div>
            <p className="text-[11px] text-[#71717A] max-w-[170px] truncate">
              {currentMessage || 'Crawling courses...'}
            </p>
          </div>
          <Maximize2 className="w-3.5 h-3.5 text-[#71717A] ml-1" />
        </button>
      </div>
    );
  }

  // Full View (iOS Bottom Sheet on mobile, Slide-over Drawer on desktop)
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end pointer-events-none select-none">
      {/* Dimmed backdrop (click to minimize) */}
      <div
        onClick={() => onMinimize(true)}
        className="fixed inset-0 bg-black/30 backdrop-blur-xs pointer-events-auto transition-opacity duration-300"
      />

      {/* Drawer / Bottom Sheet Panel */}
      <aside className="relative w-full sm:max-w-md bg-[#fbf8f5] max-h-[88vh] sm:max-h-full sm:h-full shadow-refero-lg rounded-t-3xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-[#4e080c]/[0.12] flex flex-col pointer-events-auto z-10 animate-slide-in-up sm:animate-slide-in-right ios-safe-bottom">
        {/* iOS Sheet Grabber Bar */}
        <div className="w-10 h-1 bg-[#4e080c]/20 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#4e080c]/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f2ebe5] text-[#4e080c] flex items-center justify-center shadow-refero-sm">
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <RefreshCw className={`w-4 h-4 ${!isComplete ? 'animate-spin' : ''}`} />
              )}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#4e080c] tracking-tight">
                Live Sync Activity
              </h2>
              <p className="text-[11.5px] text-[#71717A]">
                {isComplete ? 'All courses crawled & indexed' : 'Fetching latest OUSL LMS updates...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onMinimize(true)}
              title="Minimize to floating pill"
              aria-label="Minimize drawer to floating pill"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#71717A] hover:bg-[#4e080c]/[0.05] hover:text-[#4e080c] active:scale-95 transition-all"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close drawer"
              aria-label="Close sync activity drawer"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#71717A] hover:bg-[#4e080c]/[0.05] hover:text-[#4e080c] active:scale-95 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Status */}
        <div className="px-5 py-3.5 bg-[#f2ebe5] border-b border-[#4e080c]/[0.08]">
          <div className="flex items-center justify-between text-[12px] font-medium mb-1.5">
            <span className="text-[#4e080c] truncate pr-2 font-medium">
              {isComplete ? 'Finished indexing all courses' : currentMessage || 'Connecting to server...'}
            </span>
            <span className="text-[#4e080c] font-semibold">{progress}%</span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2 bg-[#4e080c]/[0.12] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isComplete
                  ? 'bg-emerald-600'
                  : isError
                  ? 'bg-rose-600'
                  : 'bg-[#4e080c]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Logs Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 font-mono text-[11.5px] leading-relaxed min-h-[200px]">
          <div className="text-[10.5px] font-bold text-[#71717A] uppercase tracking-wider font-sans mb-2">
            Crawler Logs ({logs.length})
          </div>

          {logs.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-2.5 rounded-xl bg-[#f2ebe5] border border-[#4e080c]/[0.05] flex items-start gap-2 text-[#4e080c]"
            >
              <span className="text-[10px] text-[#71717A] shrink-0 font-sans mt-0.5">{item.time}</span>
              <div className="flex-1 break-words">
                {item.type === 'done' ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {item.message}
                  </span>
                ) : item.type === 'error' ? (
                  <span className="text-rose-600 font-medium font-sans">
                    {item.message}
                  </span>
                ) : (
                  <span>{item.message}</span>
                )}
              </div>
            </div>
          ))}

          {!isComplete && !isError && (
            <div className="p-2.5 rounded-xl bg-[#4e080c]/[0.05] border border-[#4e080c]/[0.08] flex items-center gap-2 text-[#4e080c] font-sans">
              <span className="w-2 h-2 rounded-full bg-[#4e080c] animate-ping" />
              <span className="text-[11.5px] font-medium animate-pulse truncate">
                {currentMessage || 'Working...'}
              </span>
            </div>
          )}

          {isError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/60 text-[#4e080c] font-sans space-y-2.5">
              <div className="text-[12.5px] font-semibold text-rose-900">
                How to run the crawler:
              </div>
              <p className="text-[11.5px] text-rose-800 leading-relaxed">
                Headless Playwright browsing requires a full OS environment. You can trigger it directly in GitHub Actions with 1 click:
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <a
                  href="https://github.com/nipunyatawara-dev/oulms-digest/actions/workflows/lms_check.yml"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4e080c] text-white text-[12px] font-medium rounded-xl shadow-refero-sm hover:bg-[#620a0f] active:scale-[0.98] transition-all min-h-[44px]"
                >
                  <span>Run on GitHub Actions</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </div>
            </div>
          )}

          <div ref={logEndRef} />
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#4e080c]/[0.08] bg-[#fbf8f5] flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#71717A]">
            {isComplete ? 'Data saved locally' : 'Syncing in background...'}
          </span>
          {isComplete ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-[13px] font-medium text-white bg-[#4e080c] rounded-xl shadow-refero-sm hover:bg-[#620a0f] active:scale-[0.98] transition-all min-h-[44px]"
            >
              Done
            </button>
          ) : (
            <button
              onClick={() => onMinimize(true)}
              className="px-4 py-2.5 text-[12.5px] font-medium text-[#4e080c] bg-white border border-[#4e080c]/[0.12] hover:bg-[#f5efe9] rounded-xl shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
            >
              Minimize
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

