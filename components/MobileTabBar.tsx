'use client';

import React from 'react';
import { LayoutDashboard, GraduationCap, Calendar, AlertCircle, BookOpen, BookMarked } from 'lucide-react';
import { CategoryFilter } from '@/components/CategoryTabs';

interface MobileTabBarProps {
  activeView: 'Dashboard' | 'Announcements' | 'Account';
  activeTab: CategoryFilter;
  onSelectView: (view: 'Dashboard' | 'Announcements' | 'Account') => void;
  onSelectTab: (tab: CategoryFilter) => void;
  gradesCount?: number;
  vivaCount?: number;
  deadlinesCount?: number;
  coursesCount?: number;
  examPrepCount?: number;
}

export function MobileTabBar({
  activeView,
  activeTab,
  onSelectView,
  onSelectTab,
  gradesCount = 0,
  vivaCount = 0,
  deadlinesCount = 0,
  coursesCount = 0,
  examPrepCount = 0,
}: MobileTabBarProps) {
  const isOverviewActive = activeView === 'Dashboard' && activeTab === 'All';
  const isGradesActive = activeView === 'Dashboard' && activeTab === 'Grades & Marks';
  const isVivaActive = activeView === 'Dashboard' && activeTab === 'Viva & Exam';
  const isDeadlinesActive = activeView === 'Dashboard' && activeTab === 'Deadlines & Quizzes';
  const isCoursesActive = activeView === 'Dashboard' && activeTab === 'Courses';
  const isExamPrepActive = activeView === 'Dashboard' && activeTab === 'Exam Preparation';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fbf8f5]/95 dark:bg-[#0f0f11]/95 backdrop-blur-md border-t border-[#4e080c]/[0.08] dark:border-white/[0.08] ios-safe-bottom select-none transition-all shadow-[0_-2px_10px_rgba(78,8,12,0.03)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)]"
      role="tablist"
      aria-label="Academic Navigation"
    >
      <div className="flex items-center justify-between h-[52px] max-w-lg mx-auto px-1.5">
        {/* Tab 1: Overview Feed */}
        <button
          onClick={() => {
            onSelectView('Dashboard');
            onSelectTab('All');
          }}
          role="tab"
          aria-selected={isOverviewActive}
          aria-label="Overview academic feed"
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-all active:scale-95 ${
            isOverviewActive
              ? 'text-[#4e080c] font-semibold'
              : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5]'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-[19px] h-[19px] transition-transform ${isOverviewActive ? 'scale-110 text-[#4e080c]' : ''}`} />
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            Overview
          </span>
        </button>

        {/* Tab 2: Grades & Marks */}
        <button
          onClick={() => {
            onSelectView('Dashboard');
            onSelectTab('Grades & Marks');
          }}
          role="tab"
          aria-selected={isGradesActive}
          aria-label={`Grades and Marks (${gradesCount} updates)`}
          className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-all active:scale-95 ${
            isGradesActive
              ? 'text-[#4e080c] font-semibold'
              : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5]'
          }`}
        >
          <div className="relative">
            <GraduationCap className={`w-[19px] h-[19px] transition-transform ${isGradesActive ? 'scale-110 text-[#4e080c]' : ''}`} />
            {gradesCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 bg-[#4e080c] text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-refero-sm">
                {gradesCount > 99 ? '99+' : gradesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            Grades
          </span>
        </button>

        {/* Tab 3: Viva & Exams */}
        <button
          onClick={() => {
            onSelectView('Dashboard');
            onSelectTab('Viva & Exam');
          }}
          role="tab"
          aria-selected={isVivaActive}
          aria-label={`Viva and Exams (${vivaCount} schedules)`}
          className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-all active:scale-95 ${
            isVivaActive
              ? 'text-[#4e080c] font-semibold'
              : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5]'
          }`}
        >
          <div className="relative">
            <Calendar className={`w-[19px] h-[19px] transition-transform ${isVivaActive ? 'scale-110 text-[#4e080c]' : ''}`} />
            {vivaCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 bg-[#4e080c] text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-refero-sm">
                {vivaCount > 99 ? '99+' : vivaCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            Vivas
          </span>
        </button>

        {/* Tab 4: Deadlines & Quizzes */}
        <button
          onClick={() => {
            onSelectView('Dashboard');
            onSelectTab('Deadlines & Quizzes');
          }}
          role="tab"
          aria-selected={isDeadlinesActive}
          aria-label={`Deadlines and Quizzes (${deadlinesCount} pending)`}
          className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-all active:scale-95 ${
            isDeadlinesActive
              ? 'text-[#4e080c] font-semibold'
              : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5]'
          }`}
        >
          <div className="relative">
            <AlertCircle className={`w-[19px] h-[19px] transition-transform ${isDeadlinesActive ? 'scale-110 text-[#4e080c]' : ''}`} />
            {deadlinesCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 bg-[#4e080c] text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-refero-sm">
                {deadlinesCount > 99 ? '99+' : deadlinesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            Deadlines
          </span>
        </button>

        {/* Tab 5: Exam Preparation */}
        <button
          onClick={() => {
            onSelectView('Dashboard');
            onSelectTab('Exam Preparation');
          }}
          role="tab"
          aria-selected={isExamPrepActive}
          aria-label={`Exam preparation (${examPrepCount} resources)`}
          className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-all active:scale-95 ${
            isExamPrepActive
              ? 'text-[#4e080c] font-semibold'
              : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5]'
          }`}
        >
          <BookMarked className={`w-[19px] h-[19px] transition-transform ${isExamPrepActive ? 'scale-110 text-[#4e080c]' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight leading-none">Exam</span>
        </button>

        {/* Tab 6: Enrolled Courses */}
        <button
          onClick={() => {
            onSelectView('Dashboard');
            onSelectTab('Courses');
          }}
          role="tab"
          aria-selected={isCoursesActive}
          aria-label={`Enrolled semester courses (${coursesCount} courses)`}
          className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-1 rounded-xl transition-all active:scale-95 ${
            isCoursesActive
              ? 'text-[#4e080c] font-semibold'
              : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5]'
          }`}
        >
          <div className="relative">
            <BookOpen className={`w-[19px] h-[19px] transition-transform ${isCoursesActive ? 'scale-110 text-[#4e080c]' : ''}`} />
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            Courses
          </span>
        </button>
      </div>
    </nav>
  );
}
