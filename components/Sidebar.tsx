'use client';

import React from 'react';
import {
  LayoutDashboard,
  Settings,
  Layers,
  GraduationCap,
  Calendar,
  AlertCircle,
  FileDown,
  BookOpen,
  ExternalLink,
  LogIn,
  X,
  Key,
  UserCheck,
} from 'lucide-react';
import { CategoryFilter } from '@/components/CategoryTabs';

interface SidebarProps {
  activeTab: CategoryFilter;
  onSelectTab: (tab: CategoryFilter) => void;
  counts: {
    all: number;
    grades: number;
    viva: number;
    deadlines: number;
    courses: number;
  };
  onOpenSchedule: () => void;
  onToggleDrawer: () => void;
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
  onOpenSchedule,
  onToggleDrawer,
  isMobileOpen,
  onCloseMobile,
  activeView = 'Dashboard',
  onSelectView,
  announcementsCount = 0,
  studentUsername,
  selectedCoursesCount,
}: SidebarProps) {
  const portalLoginUrl = 'https://oulms.ou.ac.lk/login/index.php';
  const displayStudent = studentUsername ? studentUsername.split('@')[0] : 'OUSL Student';

  const sidebarContent = (
    <div className="w-full flex flex-col justify-between h-full text-[13px] select-none">
      <div className="space-y-4">
        {/* User / Profile Header */}
        <div className="px-2 pt-1 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-[#4e080c] text-[14px]">
              <span className="truncate max-w-[150px]">{displayStudent}</span>
              <a
                href={portalLoginUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#71717A] hover:text-[#4e080c] transition-colors"
                title="Open OUSL Moodle Profile"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {isMobileOpen && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1 text-[#71717A] hover:text-[#4e080c] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[11.5px] text-[#71717A] mt-0.5 truncate">
            {studentUsername ? 'Logged in Student' : 'Active Student'} &bull; oulms.ou.ac.lk
          </p>
        </div>

        {/* Section 1: Core Navigation */}
        <div className="space-y-0.5">
          <button
            onClick={() => {
              onSelectView?.('Dashboard');
              onSelectTab('All');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
              activeView === 'Dashboard' && activeTab === 'All'
                ? 'bg-[#e8ddd5] text-[#4e080c] font-medium'
                : 'text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 text-[#71717A]" />
              <span>Overview</span>
            </div>
            {counts.all > 0 && (
              <span className="text-[11px] text-[#71717A] font-normal">
                {counts.all}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onSelectView?.('Account');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
              activeView === 'Account'
                ? 'bg-[#e8ddd5] text-[#4e080c] font-medium'
                : 'text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-[#71717A]" />
              <span>Credentials & Courses</span>
            </div>
            {studentUsername ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Configured" />
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                Setup
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onOpenSchedule();
              onCloseMobile?.();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05] transition-all"
          >
            <Settings className="w-4 h-4 text-[#71717A]" />
            <span>Schedule</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#4e080c]/[0.08]" />

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
                ? 'bg-[#e8ddd5] text-[#4e080c] font-medium'
                : 'text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-[#71717A]" />
              <span>Enrolled Courses</span>
            </div>
            <span className="text-[11px] text-[#71717A]">{counts.courses}</span>
          </button>

          <button
            onClick={() => {
              onSelectView?.('Dashboard');
              onSelectTab('Grades & Marks');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
              activeView === 'Dashboard' && activeTab === 'Grades & Marks'
                ? 'bg-[#e8ddd5] text-[#4e080c] font-medium'
                : 'text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-[#71717A]" />
              <span>Grades & Marks</span>
            </div>
            {counts.grades > 0 && (
              <span className="text-[11px] text-[#71717A]">{counts.grades}</span>
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
                ? 'bg-[#e8ddd5] text-[#4e080c] font-medium'
                : 'text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#71717A]" />
              <span>Viva & Exams</span>
            </div>
            {counts.viva > 0 && (
              <span className="text-[11px] text-[#71717A]">{counts.viva}</span>
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
                ? 'bg-[#e8ddd5] text-[#4e080c] font-medium'
                : 'text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#71717A]" />
              <span>Deadlines & Quizzes</span>
            </div>
            {counts.deadlines > 0 && (
              <span className="text-[11px] text-[#71717A]">{counts.deadlines}</span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[#4e080c]/[0.08]" />

        {/* Section 3: Tools & Export */}
        <div className="space-y-0.5">
          <a
            href="/api/export-pdf"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05] transition-all"
          >
            <FileDown className="w-4 h-4 text-[#71717A]" />
            <span>Export Batch PDF</span>
          </a>
        </div>

        {/* Divider */}
        <div className="border-t border-[#4e080c]/[0.08]" />

        {/* Section 4: Direct Links */}
        <div className="space-y-0.5">
          <a
            href={portalLoginUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <LogIn className="w-4 h-4 text-[#71717A]" />
              <span>Login to Portal</span>
            </div>
            <ExternalLink className="w-3 h-3 text-[#8E8E93]" />
          </a>

          <a
            href="https://oulms.ou.ac.lk"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-[#71717A]" />
              <span>OUSL LMS Docs</span>
            </div>
            <ExternalLink className="w-3 h-3 text-[#8E8E93]" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block w-52 lg:w-56 shrink-0 pr-2 sticky top-6">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Sidebar Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-64 max-w-[80vw] bg-[#fbf8f5] h-full p-5 shadow-refero-lg border-r border-[#4e080c]/[0.12] z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
