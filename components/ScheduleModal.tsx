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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-[#F4F4F0] rounded-2xl border border-black/[0.08] shadow-refero-lg overflow-hidden p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAEAE5] text-[#18181B] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#18181B] tracking-tight">
                Daily Crawl Schedule
              </h2>
              <p className="text-[12px] text-[#71717A]">
                Automated headless background indexing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#71717A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="mt-5 space-y-3.5">
          {/* Toggle Auto Sync */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#EAEAE5] border border-black/[0.04]">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#18181B]" />
              <div>
                <span className="text-[13px] font-semibold text-[#18181B] block">
                  Automatic Background Sync
                </span>
                <span className="text-[11.5px] text-[#71717A] block">
                  Scheduled crawler execution
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
              <div className="w-10 h-5 bg-black/[0.15] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#18181B]" />
            </label>
          </div>

          {/* Time Picker 1: Morning */}
          <div className="p-3.5 rounded-xl bg-[#EAEAE5] border border-black/[0.04]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12.5px] font-semibold text-[#18181B] flex items-center gap-1.5">
                <span>1. Morning Crawl</span>
              </label>
              <span className="text-[11px] text-[#71717A]">Sri Lanka Time</span>
            </div>
            <input
              type="time"
              value={time1}
              onChange={(e) => setTime1(e.target.value)}
              disabled={!autoSync}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/[0.08] text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-1 focus:ring-black/20 disabled:opacity-40"
            />
          </div>

          {/* Time Picker 2: Afternoon */}
          <div className="p-3.5 rounded-xl bg-[#EAEAE5] border border-black/[0.04]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12.5px] font-semibold text-[#18181B] flex items-center gap-1.5">
                <span>2. Afternoon Crawl</span>
              </label>
              <span className="text-[11px] text-[#71717A]">Sri Lanka Time</span>
            </div>
            <input
              type="time"
              value={time2}
              onChange={(e) => setTime2(e.target.value)}
              disabled={!autoSync}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/[0.08] text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-1 focus:ring-black/20 disabled:opacity-40"
            />
          </div>

          {/* Time Picker 3: Night */}
          <div className="p-3.5 rounded-xl bg-[#EAEAE5] border border-black/[0.04]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12.5px] font-semibold text-[#18181B] flex items-center gap-1.5">
                <span>3. Night Crawl</span>
              </label>
              <span className="text-[11px] text-[#71717A]">Sri Lanka Time</span>
            </div>
            <input
              type="time"
              value={time3}
              onChange={(e) => setTime3(e.target.value)}
              disabled={!autoSync}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-black/[0.08] text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-1 focus:ring-black/20 disabled:opacity-40"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium text-white bg-[#18181B] hover:bg-[#27272A] shadow-refero-sm disabled:opacity-60 transition-all"
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

