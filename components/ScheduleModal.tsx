'use client';

import React, { useState } from 'react';
import { Clock, X, Check, Bell } from 'lucide-react';
import { UserSettings } from '@/lib/types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: Partial<UserSettings>) => Promise<void>;
}

export function ScheduleModal({ isOpen, onClose, settings, onSave }: ScheduleModalProps) {
  const [morning, setMorning] = useState(settings.morning_time || '07:30');
  const [evening, setEvening] = useState(settings.evening_time || '19:30');
  const [enabled, setEnabled] = useState(settings.auto_sync_enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        morning_time: morning,
        evening_time: evening,
        auto_sync_enabled: enabled,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-2xl shadow-apple-lg border border-black/[0.08] overflow-hidden p-6 text-[#1D1D1F]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight">Sync Schedule</h2>
              <p className="text-[12px] text-[#86868B]">Automate twice-daily background crawls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#86868B] hover:bg-black/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-[#F5F5F7] rounded-xl">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#86868B]" />
              <span className="text-[14px] font-medium">Enable Automatic Sync</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0071E3]"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#F5F5F7] rounded-xl border border-black/[0.04]">
              <label className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1">
                Morning Sync
              </label>
              <input
                type="time"
                value={morning}
                disabled={!enabled}
                onChange={(e) => setMorning(e.target.value)}
                className="w-full bg-white text-[15px] font-medium px-2.5 py-1.5 rounded-lg border border-black/[0.08] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 disabled:opacity-50"
              />
              <span className="text-[10px] text-[#86868B] mt-1 block">Default: 07:30 AM</span>
            </div>

            <div className="p-3.5 bg-[#F5F5F7] rounded-xl border border-black/[0.04]">
              <label className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1">
                Evening Sync
              </label>
              <input
                type="time"
                value={evening}
                disabled={!enabled}
                onChange={(e) => setEvening(e.target.value)}
                className="w-full bg-white text-[15px] font-medium px-2.5 py-1.5 rounded-lg border border-black/[0.08] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 disabled:opacity-50"
              />
              <span className="text-[10px] text-[#86868B] mt-1 block">Default: 07:30 PM</span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="apple-btn px-5 py-2 text-[13px] font-semibold text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-xl shadow-apple-sm flex items-center gap-1.5 disabled:opacity-60"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : saving ? (
                'Saving...'
              ) : (
                'Save Schedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
