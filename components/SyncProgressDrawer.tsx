'use client';

import React, { useEffect, useRef } from 'react';
import { RefreshCw, Minimize2, Maximize2, X, CheckCircle2, AlertTriangle, ShieldCheck, BookOpen, Layers } from 'lucide-react';

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
      <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
        <button
          onClick={() => onMinimize(false)}
          className="apple-btn flex items-center gap-3 px-4 py-2.5 bg-white/90 backdrop-blur-xl rounded-full shadow-apple-lg border border-black/[0.08] hover:bg-white text-[#1D1D1F]"
        >
          <div className="relative flex items-center justify-center">
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : isError ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <RefreshCw className="w-4.5 h-4.5 animate-spin text-[#0071E3]" />
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[12.5px] font-semibold">
                {isComplete ? 'Sync Complete' : isError ? 'Sync Error' : `Syncing (${progress}%)`}
              </span>
            </div>
            <p className="text-[11px] text-[#86868B] max-w-[170px] truncate">
              {currentMessage || 'Crawling courses...'}
            </p>
          </div>
          <Maximize2 className="w-3.5 h-3.5 text-[#86868B] ml-1" />
        </button>
      </div>
    );
  }

  // Full Slide-over Drawer View
  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Dimmed backdrop (click to minimize) */}
      <div
        onClick={() => onMinimize(true)}
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300"
      />

      {/* Drawer panel */}
      <aside className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl h-full shadow-apple-lg border-l border-black/[0.08] flex flex-col pointer-events-auto z-10 animate-slide-in-right">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <RefreshCw className={`w-4.5 h-4.5 ${!isComplete ? 'animate-spin' : ''}`} />
              )}
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#1D1D1F] tracking-tight">
                Live Sync Activity
              </h2>
              <p className="text-[11.5px] text-[#86868B]">
                {isComplete ? 'All courses crawled & indexed' : 'Fetching latest OUSL LMS updates...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onMinimize(true)}
              title="Minimize to floating pill"
              className="p-1.5 rounded-lg text-[#86868B] hover:bg-black/[0.05] hover:text-[#1D1D1F] transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close drawer"
              className="p-1.5 rounded-lg text-[#86868B] hover:bg-black/[0.05] hover:text-[#1D1D1F] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Status */}
        <div className="px-5 py-4 bg-[#F5F5F7]/70 border-b border-black/[0.04]">
          <div className="flex items-center justify-between text-[12px] font-medium mb-1.5">
            <span className="text-[#1D1D1F] truncate pr-2">
              {isComplete ? '🎉 Finished indexing 19 courses' : currentMessage || 'Connecting to server...'}
            </span>
            <span className="text-[#0071E3] font-semibold">{progress}%</span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2 bg-black/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isComplete
                  ? 'bg-emerald-500'
                  : isError
                  ? 'bg-rose-500'
                  : 'bg-[#0071E3]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Logs Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 font-mono text-[11.5px] leading-relaxed">
          <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider font-sans mb-3">
            Real-Time Crawler Logs ({logs.length})
          </div>

          {logs.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-2.5 rounded-lg bg-black/[0.02] border border-black/[0.03] flex items-start gap-2 text-[#1D1D1F]"
            >
              <span className="text-[10px] text-[#86868B] shrink-0 font-sans mt-0.5">{item.time}</span>
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
            <div className="p-2.5 rounded-lg bg-[#0071E3]/5 border border-[#0071E3]/15 flex items-center gap-2 text-[#0071E3] font-sans">
              <span className="w-2 h-2 rounded-full bg-[#0071E3] animate-ping" />
              <span className="text-[11.5px] font-medium animate-pulse truncate">
                {currentMessage || 'Working...'}
              </span>
            </div>
          )}

          <div ref={logEndRef} />
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-black/[0.06] bg-white flex items-center justify-between">
          <span className="text-[11px] text-[#86868B]">
            {isComplete ? 'Updated data saved locally' : 'Syncing in background...'}
          </span>
          {isComplete ? (
            <button
              onClick={onClose}
              className="apple-btn px-4 py-1.5 text-[12.5px] font-semibold text-white bg-[#0071E3] rounded-lg shadow-apple-sm"
            >
              Done
            </button>
          ) : (
            <button
              onClick={() => onMinimize(true)}
              className="apple-btn px-3 py-1.5 text-[12px] font-medium text-[#1D1D1F] bg-[#F5F5F7] hover:bg-black/[0.06] rounded-lg"
            >
              Minimize
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
