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
        github_token: activeSettings?.github_token,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs select-none p-0 sm:p-4">
      {/* Backdrop tap to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg sm:max-w-md bg-[#fbf8f5] rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#4e080c]/[0.12] shadow-refero-lg overflow-hidden p-6 sm:p-7 ios-safe-bottom animate-slide-in-up sm:animate-fade-in z-10">
        {/* iOS Sheet Grabber Bar */}
        <div className="w-10 h-1 bg-[#4e080c]/20 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#4e080c]/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f2ebe5] text-[#4e080c] flex items-center justify-center shadow-refero-sm">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#4e080c] tracking-tight">
                Daily Crawl Schedule
              </h2>
              <p className="text-[12px] text-[#71717A]">
                Automated background academic indexing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#4e080c]/[0.05] hover:bg-[#4e080c]/[0.1] active:bg-[#4e080c]/[0.15] flex items-center justify-center text-[#71717A] hover:text-[#4e080c] transition-all active:scale-95"
            aria-label="Close schedule settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="mt-5 space-y-3.5">
          {/* Toggle Auto Sync */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f2ebe5] border border-[#4e080c]/[0.05]">
            <div className="flex items-center gap-2.5 pr-2">
              <Bell className="w-4 h-4 text-[#4e080c] shrink-0" />
              <div>
                <span className="text-[13px] font-semibold text-[#4e080c] block">
                  Automatic Background Sync
                </span>
                <span className="text-[11.5px] text-[#71717A] block">
                  Scheduled crawler execution
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[48px] justify-end">
              <input
                type="checkbox"
                role="switch"
                aria-checked={autoSync}
                aria-label="Toggle automatic background sync"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#4e080c]/[0.15] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:right-[22px] peer-checked:after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4e080c]" />
            </label>
          </div>

          {/* Time Picker 1: Morning */}
          <div className="p-3.5 rounded-2xl bg-[#f2ebe5] border border-[#4e080c]/[0.05]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12.5px] font-semibold text-[#4e080c] flex items-center gap-1.5">
                <span>1. Morning Crawl</span>
              </label>
              <span className="text-[11px] text-[#71717A]">Sri Lanka Time</span>
            </div>
            <input
              type="time"
              value={time1}
              onChange={(e) => setTime1(e.target.value)}
              disabled={!autoSync}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#4e080c]/[0.12] text-[14px] font-medium text-[#4e080c] focus:outline-none focus:ring-1 focus:ring-[#4e080c]/20 disabled:opacity-40 min-h-[44px]"
            />
          </div>

          {/* Time Picker 2: Afternoon */}
          <div className="p-3.5 rounded-2xl bg-[#f2ebe5] border border-[#4e080c]/[0.05]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12.5px] font-semibold text-[#4e080c] flex items-center gap-1.5">
                <span>2. Afternoon Crawl</span>
              </label>
              <span className="text-[11px] text-[#71717A]">Sri Lanka Time</span>
            </div>
            <input
              type="time"
              value={time2}
              onChange={(e) => setTime2(e.target.value)}
              disabled={!autoSync}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#4e080c]/[0.12] text-[14px] font-medium text-[#4e080c] focus:outline-none focus:ring-1 focus:ring-[#4e080c]/20 disabled:opacity-40 min-h-[44px]"
            />
          </div>

          {/* Time Picker 3: Night */}
          <div className="p-3.5 rounded-2xl bg-[#f2ebe5] border border-[#4e080c]/[0.05]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12.5px] font-semibold text-[#4e080c] flex items-center gap-1.5">
                <span>3. Night Crawl</span>
              </label>
              <span className="text-[11px] text-[#71717A]">Sri Lanka Time</span>
            </div>
            <input
              type="time"
              value={time3}
              onChange={(e) => setTime3(e.target.value)}
              disabled={!autoSync}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#4e080c]/[0.12] text-[14px] font-medium text-[#4e080c] focus:outline-none focus:ring-1 focus:ring-[#4e080c]/20 disabled:opacity-40 min-h-[44px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05] active:scale-[0.98] transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-medium text-white bg-[#4e080c] hover:bg-[#620a0f] shadow-refero-sm disabled:opacity-60 active:scale-[0.98] transition-all min-h-[44px]"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
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

