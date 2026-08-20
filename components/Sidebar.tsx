'use client';

import React from 'react';
import {
  LayoutDashboard,
  Settings,
  Layers,
  GraduationCap,
  Calendar,
  AlertCircle,
  BarChart3,
  Clock,
  FileDown,
  BookOpen,
  ExternalLink,
  LogIn,
  X,
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
  activeView?: 'Dashboard' | 'Announcements';
  onSelectView?: (view: 'Dashboard' | 'Announcements') => void;
  announcementsCount?: number;
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
}: SidebarProps) {
  const portalLoginUrl = 'https://oulms.ou.ac.lk/login/index.php';

  const sidebarContent = (
    <div className="w-full flex flex-col justify-between h-full text-[13px] select-none">
      <div className="space-y-4">
        {/* User / Profile Header */}
        <div className="px-2 pt-1 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-[#18181B] text-[14px]">
              <span>OUSL Student</span>
              <a
                href={portalLoginUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#71717A] hover:text-[#18181B] transition-colors"
                title="Open OUSL Moodle Profile"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {isMobileOpen && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1 text-[#71717A] hover:text-[#18181B] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[11.5px] text-[#71717A] mt-0.5 truncate">
            Active Student &bull; oulms.ou.ac.lk
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
                ? 'bg-[#E3E3DC] text-[#18181B] font-medium'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03]'
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
              onSelectView?.('Announcements');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
              activeView === 'Announcements'
                ? 'bg-[#E3E3DC] text-[#18181B] font-medium'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#71717A]" />
              <span>Announcements</span>
            </div>
            {announcementsCount > 0 && (
              <span className="text-[11px] text-[#71717A] font-normal">
                {announcementsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onOpenSchedule();
              onCloseMobile?.();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03] transition-all"
          >
            <Settings className="w-4 h-4 text-[#71717A]" />
            <span>Settings</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.06]" />

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
                ? 'bg-[#E3E3DC] text-[#18181B] font-medium'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03]'
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
                ? 'bg-[#E3E3DC] text-[#18181B] font-medium'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03]'
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
                ? 'bg-[#E3E3DC] text-[#18181B] font-medium'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03]'
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
                ? 'bg-[#E3E3DC] text-[#18181B] font-medium'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03]'
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
        <div className="border-t border-black/[0.06]" />

        {/* Section 3: Tools & Automations */}
        <div className="space-y-0.5">
          <button
            onClick={() => {
              onToggleDrawer();
              onCloseMobile?.();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03] transition-all"
          >
            <BarChart3 className="w-4 h-4 text-[#71717A]" />
            <span>Crawler Activity</span>
          </button>

          <button
            onClick={() => {
              onOpenSchedule();
              onCloseMobile?.();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03] transition-all"
          >
            <Clock className="w-4 h-4 text-[#71717A]" />
            <span>Sync Schedule</span>
          </button>

          <a
            href="/api/export-pdf"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03] transition-all"
          >
            <FileDown className="w-4 h-4 text-[#71717A]" />
            <span>Export Batch PDF</span>
          </a>
        </div>

        {/* Divider */}
        <div className="border-t border-black/[0.06]" />

        {/* Section 4: Direct Links */}
        <div className="space-y-0.5">
          <a
            href={portalLoginUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03] transition-all"
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
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.03] transition-all"
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
          <div className="relative w-64 max-w-[80vw] bg-[#F4F4F0] h-full p-5 shadow-refero-lg border-r border-black/[0.08] z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
