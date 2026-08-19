import React from 'react';
import { BookOpen, Bell, MessageSquare, Zap } from 'lucide-react';

interface StatsOverviewProps {
  totalCourses: number;
  totalNotifications: number;
  totalUpdates: number;
  durationSeconds?: number;
}

export function StatsOverview({
  totalCourses,
  totalNotifications,
  totalUpdates,
  durationSeconds,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="p-3.5 sm:p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-apple-sm overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11.5px] sm:text-[12px] font-medium text-[#86868B] truncate">Enrolled Courses</span>
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[20px] sm:text-[24px] font-bold text-[#1D1D1F] tracking-tight leading-none">{totalCourses}</span>
          <span className="text-[11px] text-[#86868B]">active modules</span>
        </div>
      </div>

      <div className="p-3.5 sm:p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-apple-sm overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11.5px] sm:text-[12px] font-medium text-[#86868B] truncate">Portal Alerts</span>
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[20px] sm:text-[24px] font-bold text-[#1D1D1F] tracking-tight leading-none">{totalNotifications}</span>
          <span className="text-[11px] text-[#86868B]">notifications</span>
        </div>
      </div>

      <div className="p-3.5 sm:p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-apple-sm overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11.5px] sm:text-[12px] font-medium text-[#86868B] truncate">Announcements</span>
          <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[20px] sm:text-[24px] font-bold text-[#1D1D1F] tracking-tight leading-none">{totalUpdates}</span>
          <span className="text-[11px] text-[#86868B]">forum topics</span>
        </div>
      </div>

      <div className="p-3.5 sm:p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-apple-sm overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11.5px] sm:text-[12px] font-medium text-[#86868B] truncate">Crawler Speed</span>
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[20px] sm:text-[24px] font-bold text-[#1D1D1F] tracking-tight leading-none">
            {durationSeconds ? `${durationSeconds}s` : 'Fast'}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Headless</span>
        </div>
      </div>
    </div>
  );
}
