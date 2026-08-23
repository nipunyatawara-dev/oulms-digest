'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ExternalLink,
  User,
  Clock,
  FileSpreadsheet,
  FileText,
  File,
  Download,
  GraduationCap,
  Folder,
  Video,
  CheckSquare,
} from 'lucide-react';
import { CourseItem, ExtractedLinkItem } from '@/lib/types';
import { getCourseGradebookUrl } from '@/lib/categoryUtils';

interface CourseCardProps {
  course: CourseItem;
  defaultExpanded?: boolean;
}

export function CourseCard({ course, defaultExpanded = false }: CourseCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const updates = course.updates || [];
  const displayedUpdates = showAllUpdates ? updates : updates.slice(0, 5);

  const toggleTopic = (id: string) => {
    setExpandedTopicId((prev) => (prev === id ? null : id));
  };

  const renderLinkIcon = (lk: ExtractedLinkItem) => {
    const t = (lk.title + ' ' + lk.url).toLowerCase();
    if (lk.type === 'sheets' || t.includes('sheet') || t.includes('excel') || t.includes('marks')) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />;
    }
    if (lk.type === 'forms' || t.includes('form') || t.includes('survey')) {
      return <CheckSquare className="w-3.5 h-3.5 text-blue-700 shrink-0" />;
    }
    if (lk.type === 'grades' || t.includes('gradebook') || t.includes('grade')) {
      return <GraduationCap className="w-3.5 h-3.5 text-amber-700 shrink-0" />;
    }
    if (lk.type === 'drive' || t.includes('drive') || t.includes('onedrive')) {
      return <Folder className="w-3.5 h-3.5 text-indigo-700 shrink-0" />;
    }
    if (lk.type === 'zoom' || t.includes('zoom') || t.includes('teams') || t.includes('meet')) {
      return <Video className="w-3.5 h-3.5 text-purple-700 shrink-0" />;
    }
    return <ExternalLink className="w-3.5 h-3.5 text-emerald-700 shrink-0" />;
  };

  const renderAttachmentIcon = (type?: string) => {
    switch (type) {
      case 'excel':
      case 'csv':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      default:
        return <File className="w-3.5 h-3.5 text-[#71717A] shrink-0" />;
    }
  };

  return (
    <div className="hover:bg-[#4e080c]/[0.02] transition-colors">
      {/* Course Main Row */}
      <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 sm:gap-4 select-none">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* Left Course Code Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-[#4e080c] text-white font-mono font-semibold text-[11.5px] tracking-wide shrink-0 shadow-refero-sm mt-0.5 sm:mt-0">
            {course.code}
          </div>

          {/* Center Info */}
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-[#4e080c] truncate">
              {course.title.replace(course.code, '').trim() || course.title}
            </h3>
            <p className="text-[12px] text-[#71717A] flex items-center gap-2 mt-0.5 flex-wrap">
              <span>{course.updates_count} discussions</span>
              {updates.length > 0 && updates[0].topic && (
                <>
                  <span>&bull;</span>
                  <span className="truncate max-w-[240px] sm:max-w-md text-[#8E8E93]">
                    Latest: {updates[0].topic}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={course.url}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12.5px] font-medium text-[#4e080c] bg-white hover:bg-[#f5efe9] border border-[#4e080c]/[0.12] rounded-lg shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
            title="Open in Moodle"
            aria-label={`Open course ${course.code} on Moodle`}
          >
            <span>Moodle</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#71717A]" />
          </a>

          {updates.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12.5px] font-medium text-[#4e080c] bg-white hover:bg-[#f5efe9] border border-[#4e080c]/[0.12] rounded-lg shadow-refero-sm active:scale-[0.98] transition-all min-h-[44px]"
              aria-label={expanded ? `Hide discussions for ${course.code}` : `Show ${updates.length} discussions for ${course.code}`}
              aria-expanded={expanded}
            >
              <span>{expanded ? 'Hide' : `Topics (${updates.length})`}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#71717A] transition-transform duration-200 ${
                  expanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Discussions Accordion */}
      {expanded && updates.length > 0 && (
        <div className="border-t border-[#4e080c]/[0.05] bg-[#fdfaf8] px-4 sm:px-6 py-2 divide-y divide-[#4e080c]/[0.05]">
          {displayedUpdates.map((update) => {
            const isTopicExpanded = expandedTopicId === update.id;
            const validLinks = update.links || [];
            const hasAttachments = Boolean(update.attachments && update.attachments.length > 0);
            const hasLinks = validLinks.length > 0;
            const isGrades = update.category === 'Grades & Marks';
            const gradebookUrl = getCourseGradebookUrl(course.url || update.link);

            return (
              <div key={update.id} className="py-3 group transition-colors">
                <div
                  onClick={() => toggleTopic(update.id)}
                  className="flex items-start justify-between gap-3 cursor-pointer select-none min-h-[44px]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#4e080c]/[0.06] text-[#4e080c]">
                        {update.category}
                      </span>
                      {update.category === 'Grades & Marks' && (
                        <span className="text-[10.5px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                          Marks
                        </span>
                      )}
                      {update.forum_name && (
                        <span className="text-[11.5px] text-[#71717A] truncate max-w-[220px]">
                          {update.forum_name}
                        </span>
                      )}
                    </div>

                    <div className="text-[13px] font-medium text-[#4e080c] group-hover:text-[#620a0f] leading-snug break-words">
                      {update.topic}
                    </div>

                    <div className="flex items-center gap-3 text-[11.5px] text-[#71717A] mt-1 flex-wrap">
                      {update.author && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3 text-[#8E8E93]" />
                          {update.author}
                        </span>
                      )}
                      {update.time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8E8E93]" />
                          {update.time}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={update.link}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05] transition-colors"
                      title="Open topic in Moodle"
                      aria-label={`Open topic "${update.topic}" on Moodle`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => toggleTopic(update.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05] transition-colors active:scale-95"
                      aria-label={isTopicExpanded ? 'Collapse topic details' : 'Expand topic details'}
                      aria-expanded={isTopicExpanded}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isTopicExpanded ? 'rotate-180 text-[#4e080c]' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Discussion Details */}
                {isTopicExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#4e080c]/[0.06] space-y-3 animate-in fade-in-50 duration-150">
                    {update.content && (
                      <div className="text-[12.5px] text-[#4e080c] bg-white p-3.5 rounded-xl border border-[#4e080c]/[0.08] shadow-refero-sm whitespace-pre-line">
                        {update.content}
                      </div>
                    )}

                    {/* Action Links & Contextual Shortcuts */}
                    {(hasLinks || (isGrades && gradebookUrl)) && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold tracking-wider uppercase text-[#71717A]">
                          Direct Action:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {validLinks.map((lk, i) => (
                            <a
                              key={i}
                              href={lk.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[12.5px] font-semibold shadow-refero-sm active:scale-[0.98] transition-all min-h-[40px]"
                            >
                              {renderLinkIcon(lk)}
                              <span>{lk.title}</span>
                            </a>
                          ))}

                          {!hasLinks && isGrades && gradebookUrl && (
                            <a
                              href={gradebookUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[12.5px] font-semibold shadow-refero-sm active:scale-[0.98] transition-all min-h-[40px]"
                              title="Open course gradebook on OUSL Portal"
                            >
                              <GraduationCap className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Check Course Gradebook</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {hasAttachments && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold tracking-wider uppercase text-[#71717A]">
                          Attached Files:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {update.attachments?.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f5efe9] active:bg-[#ede3da] text-[#4e080c] border border-[#4e080c]/[0.12] rounded-lg text-[12px] font-medium shadow-refero-sm active:scale-[0.98] transition-all min-h-[38px]"
                            >
                              {renderAttachmentIcon(att.type)}
                              <span>{att.name}</span>
                              <Download className="w-3.5 h-3.5 text-[#71717A]" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {updates.length > 5 && (
            <div className="py-2.5 text-center">
              <button
                onClick={() => setShowAllUpdates(!showAllUpdates)}
                className="text-[12px] font-medium text-[#4e080c] hover:underline inline-flex items-center justify-center gap-1 py-1 px-3 min-h-[44px]"
              >
                {showAllUpdates ? 'Show fewer discussions' : `Show all ${updates.length} discussions`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
