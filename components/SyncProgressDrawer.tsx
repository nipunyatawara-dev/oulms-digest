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
      <div className="fixed bottom-6 right-6 z-50 select-none">
        <button
          onClick={() => onMinimize(false)}
          className="flex items-center gap-3 px-4 py-2.5 bg-[#F4F4F0] rounded-xl shadow-refero-lg border border-black/[0.12] hover:bg-[#EAEAE5] text-[#18181B] transition-all"
        >
          <div className="relative flex items-center justify-center">
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#18181B]" />
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] font-semibold text-[#18181B]">
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

  // Full Slide-over Drawer View
  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none select-none">
      {/* Dimmed backdrop (click to minimize) */}
      <div
        onClick={() => onMinimize(true)}
        className="fixed inset-0 bg-black/20 backdrop-blur-xs pointer-events-auto transition-opacity duration-300"
      />

      {/* Drawer panel */}
      <aside className="relative w-full max-w-md bg-[#F4F4F0] h-full shadow-refero-lg border-l border-black/[0.08] flex flex-col pointer-events-auto z-10 animate-slide-in-right">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EAEAE5] text-[#18181B] flex items-center justify-center">
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <RefreshCw className={`w-4 h-4 ${!isComplete ? 'animate-spin' : ''}`} />
              )}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#18181B] tracking-tight">
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
              className="p-1.5 rounded-lg text-[#71717A] hover:bg-black/[0.04] hover:text-[#18181B] transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close drawer"
              className="p-1.5 rounded-lg text-[#71717A] hover:bg-black/[0.04] hover:text-[#18181B] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Status */}
        <div className="px-5 py-3.5 bg-[#EAEAE5] border-b border-black/[0.04]">
          <div className="flex items-center justify-between text-[12px] font-medium mb-1.5">
            <span className="text-[#18181B] truncate pr-2">
              {isComplete ? 'Finished indexing 19 courses' : currentMessage || 'Connecting to server...'}
            </span>
            <span className="text-[#18181B] font-semibold">{progress}%</span>
          </div>

          {/* Progress track */}
          <div className="w-full h-1.5 bg-black/[0.08] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isComplete
                  ? 'bg-emerald-600'
                  : isError
                  ? 'bg-rose-600'
                  : 'bg-[#18181B]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Logs Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 font-mono text-[11.5px] leading-relaxed">
          <div className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider font-sans mb-2">
            Crawler Logs ({logs.length})
          </div>

          {logs.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-2.5 rounded-lg bg-[#EAEAE5] border border-black/[0.03] flex items-start gap-2 text-[#18181B]"
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
            <div className="p-2.5 rounded-lg bg-black/[0.04] border border-black/[0.06] flex items-center gap-2 text-[#18181B] font-sans">
              <span className="w-2 h-2 rounded-full bg-[#18181B] animate-ping" />
              <span className="text-[11.5px] font-medium animate-pulse truncate">
                {currentMessage || 'Working...'}
              </span>
            </div>
          )}

          {isError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/60 text-[#18181B] font-sans space-y-2.5">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] text-white text-[12px] font-medium rounded-lg shadow-refero-sm hover:bg-[#27272A] transition-all"
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
        <div className="p-4 border-t border-black/[0.06] bg-[#F4F4F0] flex items-center justify-between">
          <span className="text-[11px] text-[#71717A]">
            {isComplete ? 'Data saved locally' : 'Syncing in background...'}
          </span>
          {isComplete ? (
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-[12.5px] font-medium text-white bg-[#18181B] rounded-lg shadow-refero-sm hover:bg-[#27272A] transition-all"
            >
              Done
            </button>
          ) : (
            <button
              onClick={() => onMinimize(true)}
              className="px-3 py-1.5 text-[12px] font-medium text-[#18181B] bg-white border border-black/[0.08] hover:bg-[#F9F9F7] rounded-lg shadow-refero-sm transition-all"
            >
              Minimize
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

