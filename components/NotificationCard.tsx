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
  Link2,
  Table,
  Eye,
  Download,
} from 'lucide-react';
import { NotificationItem, AttachmentItem, ExtractedLinkItem } from '@/lib/types';

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

  const hasAttachments = notification.attachments && notification.attachments.length > 0;
  const hasLinks = notification.links && notification.links.length > 0;
  const hasFullContent =
    notification.content &&
    notification.content.trim() !== '' &&
    notification.content.trim() !== notification.title.trim();

  const isGradesCategory = notification.category === 'Grades & Marks';

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
        className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none group"
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
                <span className="px-1.5 py-0.2 text-[10.5px] font-semibold bg-blue-100 text-blue-800 rounded-md">
                  New
                </span>
              )}
              {isGradesCategory && (
                <span className="px-1.5 py-0.2 text-[10.5px] font-semibold bg-amber-100 text-amber-900 rounded-md">
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
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <a
            href={targetLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[12.5px] font-medium text-[#4e080c] bg-white hover:bg-[#f5efe9] border border-[#4e080c]/[0.12] rounded-lg shadow-refero-sm transition-all"
            title="Open in OUSL Portal"
          >
            <span>Open</span>
            <ExternalLink className="w-3 h-3 text-[#71717A]" />
          </a>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05] rounded-lg transition-colors"
            title={expanded ? 'Collapse' : 'Expand full details'}
            aria-label="Toggle details"
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
          {/* Notification Full Content / Body */}
          <div className="text-[13px] sm:text-[13.5px] text-[#4e080c] leading-relaxed space-y-2">
            {hasFullContent ? (
              <div className="whitespace-pre-line bg-white p-3.5 rounded-xl border border-[#4e080c]/[0.08] shadow-refero-sm">
                {notification.content}
              </div>
            ) : (
              <div className="bg-white p-3.5 rounded-xl border border-[#4e080c]/[0.08] shadow-refero-sm flex items-center gap-2 text-[#71717A]">
                <Table className="w-4 h-4 text-[#4e080c]" />
                <span>
                  Academic update for <strong className="text-[#4e080c]">{notification.course_code || 'OUSL Portal'}</strong>. Click below to view the linked marks, tables, or complete notice.
                </span>
              </div>
            )}
          </div>

          {/* Action Links & External Sheets (e.g. Google Sheets Marks / Drive) */}
          {hasLinks && (
            <div className="space-y-1.5">
              <div className="text-[11.5px] font-semibold tracking-wider uppercase text-[#71717A] flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#4e080c]" />
                <span>Quick Access & Links</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {notification.links?.map((lk, i) => (
                  <a
                    key={i}
                    href={lk.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[12.5px] font-medium shadow-refero-sm transition-all group"
                  >
                    {lk.type === 'sheets' ? (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{lk.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Direct File Attachments (Excel, CSV, PDF) */}
          {hasAttachments && (
            <div className="space-y-1.5">
              <div className="text-[11.5px] font-semibold tracking-wider uppercase text-[#71717A] flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#4e080c]" />
                <span>Attached Files & Spreadsheets</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {notification.attachments?.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-[#f5efe9] text-[#4e080c] border border-[#4e080c]/[0.12] rounded-lg text-[12.5px] font-medium shadow-refero-sm transition-all"
                  >
                    {renderAttachmentIcon(att.type)}
                    <span className="truncate max-w-xs">{att.name}</span>
                    <Download className="w-3 h-3 text-[#71717A]" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Quick CTA Bottom Toolbar */}
          <div className="pt-2 flex items-center justify-between gap-3 flex-wrap text-[12px] text-[#71717A] border-t border-[#4e080c]/[0.06]">
            <span>
              Category: <strong className="text-[#4e080c]">{notification.category}</strong>
            </span>
            <a
              href={targetLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#4e080c] font-medium hover:underline hover:text-[#620a0f]"
            >
              <span>View Discussion / Full Notice on OUSL Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
