'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Award,
  Calendar,
  AlertCircle,
  Bell,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  File,
  Download,
  GraduationCap,
  Folder,
  Video,
  CheckSquare,
} from 'lucide-react';
import { NotificationItem, ExtractedLinkItem } from '@/lib/types';
import { getCourseGradebookUrl } from '@/lib/categoryUtils';

interface NotificationCardProps {
  notification: NotificationItem;
  defaultExpanded?: boolean;
}

export function NotificationCard({ notification, defaultExpanded = false }: NotificationCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Grades & Marks':
        return Award;
      case 'Viva & Exam':
        return Calendar;
      case 'Deadlines & Quizzes':
        return AlertCircle;
      default:
        return Bell;
    }
  };

  const IconComponent = getCategoryIcon(notification.category);

  const targetLink =
    notification.link && notification.link !== '#'
      ? notification.link
      : 'https://oulms.ou.ac.lk/message/output/popup/notifications.php';

  const validLinks = notification.links || [];
  const hasAttachments = Boolean(notification.attachments && notification.attachments.length > 0);
  const hasLinks = validLinks.length > 0;
  const isGradesCategory = notification.category === 'Grades & Marks';
  const gradebookUrl = getCourseGradebookUrl(targetLink);

  const renderLinkIcon = (lk: ExtractedLinkItem) => {
    const t = (lk.title + ' ' + lk.url).toLowerCase();
    if (lk.type === 'sheets' || t.includes('sheet') || t.includes('excel') || t.includes('marks')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />;
    }
    if (lk.type === 'forms' || t.includes('form') || t.includes('survey')) {
      return <CheckSquare className="w-4 h-4 text-blue-700 shrink-0" />;
    }
    if (lk.type === 'grades' || t.includes('gradebook') || t.includes('grade')) {
      return <GraduationCap className="w-4 h-4 text-amber-700 shrink-0" />;
    }
    if (lk.type === 'drive' || t.includes('drive') || t.includes('onedrive')) {
      return <Folder className="w-4 h-4 text-indigo-700 shrink-0" />;
    }
    if (lk.type === 'zoom' || t.includes('zoom') || t.includes('teams') || t.includes('meet')) {
      return <Video className="w-4 h-4 text-purple-700 shrink-0" />;
    }
    return <ExternalLink className="w-4 h-4 text-emerald-700 shrink-0" />;
  };

  const renderAttachmentIcon = (type?: string) => {
    switch (type) {
      case 'excel':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-600" />;
      default:
        return <File className="w-4 h-4 text-[#71717A]" />;
    }
  };

  return (
    <div className="transition-colors hover:bg-[#4e080c]/[0.015]">
      {/* Main Row Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none group min-h-[54px] active:bg-[#4e080c]/[0.03] transition-colors"
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* Left Category Icon */}
          <div className="w-8 h-8 rounded-lg bg-[#4e080c]/[0.05] text-[#4e080c] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 group-hover:scale-105 transition-transform">
            <IconComponent className="w-4 h-4 text-[#4e080c]" />
          </div>

          {/* Center Title and Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13.5px] sm:text-[14px] font-semibold text-[#4e080c] group-hover:text-[#620a0f] transition-colors leading-snug break-words">
                {notification.title}
              </span>
              {notification.is_new && (
                <span className="px-1.5 py-0.5 text-[10.5px] font-semibold bg-blue-100 text-blue-800 rounded-md">
                  New
                </span>
              )}
              {isGradesCategory && (
                <span className="px-1.5 py-0.5 text-[10.5px] font-semibold bg-amber-100 text-amber-900 rounded-md">
                  Marks
                </span>
              )}
            </div>

            <div className="text-[12px] text-[#71717A] flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="font-medium text-[#4e080c]">{notification.category}</span>
              {(notification.course_code || notification.course_name) && (
                <>
                  <span>&bull;</span>
                  <span className="truncate max-w-[200px] sm:max-w-xs font-mono font-medium">
                    {notification.course_code || notification.course_name}
                  </span>
                </>
              )}
              {notification.time && (
                <>
                  <span>&bull;</span>
                  <span>{notification.time}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: Open Link & Expand Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <a
            href={targetLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 text-[12.5px] font-medium text-[#4e080c] bg-white hover:bg-[#f5efe9] border border-[#4e080c]/[0.12] rounded-lg shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
            title="Open in OUSL Portal"
            aria-label={`Open notice "${notification.title}" in OUSL Portal`}
          >
            <span>Open</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#71717A]" />
          </a>

          <button
            onClick={() => setExpanded(!expanded)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05] rounded-lg transition-colors active:scale-95"
            title={expanded ? 'Collapse details' : 'Expand full details'}
            aria-label={expanded ? 'Collapse details' : 'Expand full details'}
            aria-expanded={expanded}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180 text-[#4e080c]' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Accordion Body */}
      {expanded && (
        <div className="border-t border-[#4e080c]/[0.06] bg-[#fdfaf8] px-5 py-4 sm:px-6 sm:py-5 space-y-4 animate-in fade-in-50 duration-200">
          {/* Notification Message Content */}
          {notification.content && (
            <div className="text-[13px] sm:text-[13.5px] text-[#4e080c] leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-xl border border-[#4e080c]/[0.08] shadow-refero-sm">
              {notification.content}
            </div>
          )}

          {/* Action Links & Contextual Shortcuts */}
          {(hasLinks || (isGradesCategory && gradebookUrl)) && (
            <div className="space-y-2">
              <div className="text-[11.5px] font-semibold tracking-wider uppercase text-[#71717A] flex items-center gap-1.5">
                <span>Direct Action:</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {/* Dynamically extracted links from the notice body */}
                {validLinks.map((lk, i) => (
                  <a
                    key={i}
                    href={lk.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[13px] font-semibold shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
                  >
                    {renderLinkIcon(lk)}
                    <span>{lk.title}</span>
                  </a>
                ))}

                {/* Contextual Course Gradebook button when no custom links are in the notice */}
                {!hasLinks && isGradesCategory && gradebookUrl && (
                  <a
                    href={gradebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[13px] font-semibold shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
                    title="Open course gradebook on OUSL Portal"
                  >
                    <GraduationCap className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Check Course Gradebook</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Direct File Attachments */}
          {hasAttachments && (
            <div className="space-y-2">
              <div className="text-[11.5px] font-semibold tracking-wider uppercase text-[#71717A] flex items-center gap-1.5">
                <span>Attached Files:</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {notification.attachments?.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#f5efe9] active:bg-[#ede3da] text-[#4e080c] border border-[#4e080c]/[0.12] rounded-xl text-[12.5px] font-medium shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
                  >
                    {renderAttachmentIcon(att.type)}
                    <span className="truncate max-w-xs">{att.name}</span>
                    <Download className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
