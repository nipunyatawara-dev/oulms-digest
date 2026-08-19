'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Bell, Check, Sparkles } from 'lucide-react';
import { UserSettings } from '@/lib/types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: UserSettings | null;
  currentSettings?: UserSettings | null;
  onSave: (newSettings: any) => Promise<void>;
}

export function ScheduleModal({
  isOpen,
  onClose,
  settings,
  currentSettings,
  onSave,
}: ScheduleModalProps) {
  const activeSettings = settings || currentSettings;
  const [time1, setTime1] = useState('07:00');
  const [time2, setTime2] = useState('16:00');
  const [time3, setTime3] = useState('22:00');
  const [autoSync, setAutoSync] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (activeSettings) {
      setTime1(activeSettings.time_1 || activeSettings.morning_time || '07:00');
      setTime2(activeSettings.time_2 || '16:00');
      setTime3(activeSettings.time_3 || activeSettings.evening_time || '22:00');
      setAutoSync(activeSettings.auto_sync_enabled !== false);
    }
  }, [activeSettings, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        time_1: time1,
        time_2: time2,
        time_3: time3,
        auto_sync_enabled: autoSync,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl border border-black/[0.08] shadow-apple-lg overflow-hidden p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">
                Daily Crawl Schedule
              </h2>
              <p className="text-[12px] text-[#86868B]">
                Automatically fetch announcements 3x daily
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#86868B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
          {/* Toggle Auto Sync */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.04]">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#0071E3]" />
              <div>
                <span className="text-[13.5px] font-medium text-[#1D1D1F] block">
                  Automatic Syncing
                </span>
                <span className="text-[11px] text-[#86868B] block">
                  Background scraping via GitHub Actions
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]" />
            </label>
          </div>

          {/* Time Picker 1: Morning */}
          <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.04]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                1. Morning Crawl
              </label>
              <span className="text-[11px] text-[#86868B]">Sri Lanka Time</span>
            </div>
            <input
              type="time"
              value={time1}
              onChange={(e) => setTime1(e.target.value)}
              disabled={!autoSync}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/[0.08] text-[14px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 disabled:opacity-50"
            />
          </div>

          {/* Time Picker 2: Afternoon */}
          <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.04]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                2. Afternoon Crawl
              </label>
              <span className="text-[11px] text-[#86868B]">Sri Lanka Time</span>
            </div>
            <input
              type="time"
              value={time2}
              onChange={(e) => setTime2(e.target.value)}
              disabled={!autoSync}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/[0.08] text-[14px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 disabled:opacity-50"
            />
          </div>

          {/* Time Picker 3: Night */}
          <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.04]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                3. Night Crawl
              </label>
              <span className="text-[11px] text-[#86868B]">Sri Lanka Time</span>
            </div>
            <input
              type="time"
              value={time3}
              onChange={(e) => setTime3(e.target.value)}
              disabled={!autoSync}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/[0.08] text-[14px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 disabled:opacity-50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="apple-btn inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-[#0071E3] hover:bg-[#0077ED] shadow-apple-sm disabled:opacity-60"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
