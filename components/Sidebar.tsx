'use client';

import React from 'react';
import {
  LayoutDashboard,
  Layers,
  GraduationCap,
  Calendar,
  AlertCircle,
  FileDown,
  BookOpen,
  ExternalLink,
  LogIn,
  X,
  CheckSquare,
  Sun,
  Moon,
  Laptop,
  BookMarked,
} from 'lucide-react';
import { CategoryFilter } from '@/components/CategoryTabs';
import { useTheme } from '@/lib/themeContext';

interface SidebarProps {
  activeTab: CategoryFilter;
  onSelectTab: (tab: CategoryFilter) => void;
  counts: {
    all: number;
    grades: number;
    viva: number;
    deadlines: number;
    courses: number;
    examPrep?: number;
  };
  onOpenSchedule?: () => void;
  onToggleDrawer?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  activeView?: 'Dashboard' | 'Announcements' | 'Account';
  onSelectView?: (view: 'Dashboard' | 'Announcements' | 'Account') => void;
  announcementsCount?: number;
  studentUsername?: string;
  selectedCoursesCount?: number;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  counts,
  isMobileOpen,
  onCloseMobile,
  activeView = 'Dashboard',
  onSelectView,
  studentUsername,
}: SidebarProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const portalLoginUrl = 'https://oulms.ou.ac.lk/login/index.php';
  const displayStudent = studentUsername ? studentUsername.split('@')[0] : 'OUSL Student';

  const sidebarContent = (
    <div className="w-full flex flex-col justify-between h-full text-[13px] select-none">
      <div className="space-y-4">
        {/* User / Profile Header */}
        <div className="px-2 pt-1 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-[#4e080c] dark:text-[#f4f4f5] text-[14px]">
              <span className="truncate max-w-[150px]">{displayStudent}</span>
              <a
                href={portalLoginUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] transition-colors p-1"
                title="Open OUSL Moodle Profile"
                aria-label="Open OUSL Moodle Profile"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <p className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa] mt-0.5 truncate">
            {studentUsername ? 'Logged in Student' : 'Active Student'} &bull; oulms.ou.ac.lk
          </p>
        </div>

        {/* Section 1: Core Navigation (Overview) */}
        <div className="space-y-0.5">
          <button
            onClick={() => {
              onSelectView?.('Dashboard');
              onSelectTab('All');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
              activeView === 'Dashboard' && activeTab === 'All'
                ? 'bg-[#e8ddd5] dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] font-medium'
                : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.05] dark:hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              <span>Overview</span>
            </div>
            {counts.all > 0 && (
              <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa] font-normal">
                {counts.all}
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#4e080c]/[0.08] dark:border-white/[0.08]" />

        {/* Section 2: Categories */}
        <div className="space-y-0.5">
          <button
            onClick={() => {
              onSelectView?.('Dashboard');
              onSelectTab('Courses');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
              activeView === 'Dashboard' && activeTab === 'Courses'
                ? 'bg-[#e8ddd5] dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] font-medium'
                : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.05] dark:hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              <span>Enrolled Courses</span>
            </div>
            <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">{counts.courses}</span>
          </button>

          <button
            onClick={() => {
              onSelectView?.('Dashboard');
              onSelectTab('Exam Preparation');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
              activeView === 'Dashboard' && activeTab === 'Exam Preparation'
                ? 'bg-[#e8ddd5] dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] font-medium'
                : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.05] dark:hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BookMarked className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              <span>Exam Preparation</span>
            </div>
            {!!counts.examPrep && (
              <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">{counts.examPrep}</span>
            )}
          </button>

          <button
            onClick={() => {
              onSelectView?.('Dashboard');
              onSelectTab('Grades & Marks');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
              activeView === 'Dashboard' && activeTab === 'Grades & Marks'
                ? 'bg-[#e8ddd5] dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] font-medium'
                : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.05] dark:hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              <span>Grades & Marks</span>
            </div>
            {counts.grades > 0 && (
              <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">{counts.grades}</span>
            )}
          </button>

          <button
            onClick={() => {
              onSelectView?.('Dashboard');
              onSelectTab('Viva & Exam');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
              activeView === 'Dashboard' && activeTab === 'Viva & Exam'
                ? 'bg-[#e8ddd5] dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] font-medium'
                : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.05] dark:hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              <span>Viva & Exams</span>
            </div>
            {counts.viva > 0 && (
              <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">{counts.viva}</span>
            )}
          </button>

          <button
            onClick={() => {
              onSelectView?.('Dashboard');
              onSelectTab('Deadlines & Quizzes');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
              activeView === 'Dashboard' && activeTab === 'Deadlines & Quizzes'
                ? 'bg-[#e8ddd5] dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] font-medium'
                : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.05] dark:hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              <span>Deadlines & Quizzes</span>
            </div>
            {counts.deadlines > 0 && (
              <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">{counts.deadlines}</span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#4e080c]/[0.08] dark:border-white/[0.08]" />

        {/* Section 3: Tools & Export */}
        <div className="space-y-0.5">
          <a
            href="/api/export-pdf"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.05] dark:hover:bg-white/[0.06] transition-all"
          >
            <FileDown className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
            <span>Export Batch PDF</span>
          </a>
        </div>

        {/* Divider */}
        <div className="border-t border-[#4e080c]/[0.08] dark:border-white/[0.08]" />

        {/* Section 4: Course selection, portal login & docs */}
        <div className="space-y-0.5">
          <button
            onClick={() => {
              onSelectView?.('Account');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
              activeView === 'Account'
                ? 'bg-[#e8ddd5] dark:bg-[#27272a] text-[#4e080c] dark:text-[#f4f4f5] font-medium'
                : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.05] dark:hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              <span>Course Selector</span>
            </div>
            <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">{counts.courses}</span>
          </button>

          <a
            href={portalLoginUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.05] dark:hover:bg-white/[0.06] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <LogIn className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              <span>Login to Portal</span>
            </div>
            <ExternalLink className="w-3 h-3 text-[#8E8E93]" />
          </a>

          <a
            href="https://oulms.ou.ac.lk"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-[#f4f4f5] hover:bg-[#4e080c]/[0.05] dark:hover:bg-white/[0.06] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-[#71717A] dark:text-[#a1a1aa]" />
              <span>OUSL LMS Docs</span>
            </div>
            <ExternalLink className="w-3 h-3 text-[#8E8E93]" />
          </a>
        </div>

        {/* Divider */}
        <div className="border-t border-[#4e080c]/[0.08] dark:border-white/[0.08]" />

        {/* Section 5: Theme Switcher in Sidebar */}
        <div className="px-1 pt-1">
          <div className="flex items-center justify-between p-1 bg-[#4e080c]/[0.05] dark:bg-white/[0.06] rounded-xl">
            <button
              onClick={() => setTheme('light')}
              title="Light Theme"
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                theme === 'light'
                  ? 'bg-white dark:bg-[#18181b] text-[#4e080c] dark:text-[#f4f4f5] shadow-refero-sm font-semibold'
                  : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              title="Dark Theme"
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-white dark:bg-[#18181b] text-[#4e080c] dark:text-[#f4f4f5] shadow-refero-sm font-semibold'
                  : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('system')}
              title="System Theme"
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                theme === 'system'
                  ? 'bg-white dark:bg-[#18181b] text-[#4e080c] dark:text-[#f4f4f5] shadow-refero-sm font-semibold'
                  : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c]'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <aside className="hidden md:block w-52 lg:w-56 shrink-0 pr-2 sticky top-6">
      {sidebarContent}
    </aside>
  );
}
