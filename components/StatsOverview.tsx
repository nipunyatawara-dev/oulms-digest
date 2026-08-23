'use client';

import React from 'react';
import { CategoryFilter } from '@/components/CategoryTabs';

interface StatsOverviewProps {
  totalCourses: number;
  totalNotifications: number;
  totalUpdates: number;
  gradesCount?: number;
  vivaCount?: number;
  deadlinesCount?: number;
  activeTab?: CategoryFilter;
  onSelectTab?: (tab: CategoryFilter) => void;
}

export function StatsOverview({
  totalCourses,
  totalNotifications,
  totalUpdates,
  gradesCount = 0,
  vivaCount = 0,
  deadlinesCount = 0,
  activeTab = 'All',
  onSelectTab,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 select-none">
      {/* Card 1: Grades & Marks (Styled like the Pro plan card) */}
      <div className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all hover:bg-[#e8ddd5] dark:hover:bg-[#222226] border border-transparent dark:border-white/[0.08]">
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-[14.5px] sm:text-[15px] font-semibold text-[#4e080c] dark:text-[#f4f4f5] tracking-tight">
              Grades & Marks
            </h3>
            <span className="text-[13px] text-[#71717A] dark:text-[#a1a1aa]">
              {gradesCount > 0 ? `${gradesCount} new` : 'Up to date'}
            </span>
          </div>
          <p className="text-[12.5px] sm:text-[13px] text-[#71717A] dark:text-[#a1a1aa] leading-relaxed mb-6">
            Continuous assessment tests (CAT), assignment evaluations, and official faculty gradebook releases.
          </p>
        </div>

        <div>
          <button
            onClick={() => onSelectTab?.(activeTab === 'Grades & Marks' ? 'All' : 'Grades & Marks')}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              activeTab === 'Grades & Marks'
                ? 'bg-[#4e080c] dark:bg-[#4e080c] text-white'
                : 'bg-white dark:bg-[#27272a] hover:bg-[#f5efe9] dark:hover:bg-[#323238] text-[#4e080c] dark:text-[#f4f4f5] border border-[#4e080c]/[0.12] dark:border-white/[0.12]'
            }`}
          >
            {activeTab === 'Grades & Marks' ? 'Viewing Grades' : 'View Grades'}
          </button>
        </div>
      </div>

      {/* Card 2: Viva & Exam (Styled like the Pro+ plan card) */}
      <div className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all hover:bg-[#e8ddd5] dark:hover:bg-[#222226] border border-transparent dark:border-white/[0.08]">
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-[14.5px] sm:text-[15px] font-semibold text-[#4e080c] dark:text-[#f4f4f5] tracking-tight">
              Viva & Exams
            </h3>
            <span className="text-[13px] text-[#71717A] dark:text-[#a1a1aa]">
              {vivaCount > 0 ? `${vivaCount} updates` : 'None pending'}
            </span>
          </div>
          <p className="text-[12.5px] sm:text-[13px] text-[#71717A] dark:text-[#a1a1aa] leading-relaxed mb-6">
            Final examination timetables, oral viva sessions, presentation dates, and physical venue notices.
          </p>
        </div>

        <div>
          <button
            onClick={() => onSelectTab?.(activeTab === 'Viva & Exam' ? 'All' : 'Viva & Exam')}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              activeTab === 'Viva & Exam'
                ? 'bg-[#4e080c] dark:bg-[#4e080c] text-white'
                : 'bg-white dark:bg-[#27272a] hover:bg-[#f5efe9] dark:hover:bg-[#323238] text-[#4e080c] dark:text-[#f4f4f5] border border-[#4e080c]/[0.12] dark:border-white/[0.12]'
            }`}
          >
            {activeTab === 'Viva & Exam' ? 'Viewing Exams' : 'View Exams'}
          </button>
        </div>
      </div>

      {/* Card 3: Deadlines & Quizzes (Styled like the Ultra plan card) */}
      <div className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all hover:bg-[#e8ddd5] dark:hover:bg-[#222226] border border-transparent dark:border-white/[0.08]">
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-[14.5px] sm:text-[15px] font-semibold text-[#4e080c] dark:text-[#f4f4f5] tracking-tight">
              Deadlines & Quizzes
            </h3>
            <span className="text-[13px] text-[#71717A] dark:text-[#a1a1aa]">
              {deadlinesCount > 0 ? `${deadlinesCount} alerts` : 'All cleared'}
            </span>
          </div>
          <p className="text-[12.5px] sm:text-[13px] text-[#71717A] dark:text-[#a1a1aa] leading-relaxed mb-6">
            Moodle online quizzes, TMA submission portal deadlines, and assignment cutoff reminders.
          </p>
        </div>

        <div>
          <button
            onClick={() => onSelectTab?.(activeTab === 'Deadlines & Quizzes' ? 'All' : 'Deadlines & Quizzes')}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              activeTab === 'Deadlines & Quizzes'
                ? 'bg-[#4e080c] dark:bg-[#4e080c] text-white'
                : 'bg-white dark:bg-[#27272a] hover:bg-[#f5efe9] dark:hover:bg-[#323238] text-[#4e080c] dark:text-[#f4f4f5] border border-[#4e080c]/[0.12] dark:border-white/[0.12]'
            }`}
          >
            {activeTab === 'Deadlines & Quizzes' ? 'Viewing Deadlines' : 'View Deadlines'}
          </button>
        </div>
      </div>
    </div>
  );
}

