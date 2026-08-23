'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ExternalLink,
  User,
  Clock,
  MessageSquare,
  FileSpreadsheet,
  FileText,
  File,
  Link2,
  Download,
  Award,
} from 'lucide-react';
import { CourseItem, ForumUpdateItem } from '@/lib/types';

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

  const renderAttachmentIcon = (type?: string) => {
    switch (type) {
      case 'excel':
      case 'csv':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />;
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <File className="w-3.5 h-3.5 text-[#71717A]" />;
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
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-[12.5px] font-medium text-[#4e080c] bg-white hover:bg-[#f5efe9] border border-[#4e080c]/[0.12] rounded-lg shadow-refero-sm transition-all"
            title="Open in Moodle"
          >
            <span>Moodle</span>
            <ExternalLink className="w-3 h-3 text-[#71717A]" />
          </a>

          {updates.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[12.5px] font-medium text-[#4e080c] bg-white hover:bg-[#f5efe9] border border-[#4e080c]/[0.12] rounded-lg shadow-refero-sm transition-all"
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
            const hasAttachments = update.attachments && update.attachments.length > 0;
            const hasLinks = update.links && update.links.length > 0;
            const hasExtraContent =
              update.content &&
              update.content.trim() !== '' &&
              update.content.trim() !== update.topic.trim();

            return (
              <div key={update.id} className="py-3 group transition-colors">
                <div
                  onClick={() => toggleTopic(update.id)}
                  className="flex items-start justify-between gap-3 cursor-pointer select-none"
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
                      className="p-1.5 rounded text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05] transition-colors"
                      title="Open topic in Moodle"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => toggleTopic(update.id)}
                      className="p-1.5 rounded text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.05] transition-colors"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isTopicExpanded ? 'rotate-180 text-[#4e080c]' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Discussion Details */}
                {isTopicExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#4e080c]/[0.06] space-y-3 animate-in fade-in-50 duration-150">
                    {hasExtraContent ? (
                      <div className="text-[12.5px] text-[#4e080c] bg-white p-3 rounded-lg border border-[#4e080c]/[0.08] shadow-refero-sm whitespace-pre-line">
                        {update.content}
                      </div>
                    ) : (
                      <div className="text-[12px] text-[#71717A] bg-white p-3 rounded-lg border border-[#4e080c]/[0.08]">
                        Discussion post in <strong className="text-[#4e080c]">{update.forum_name}</strong> for {course.title}.
                      </div>
                    )}

                    {hasLinks && (
                      <div className="flex flex-wrap gap-2">
                        {update.links?.map((lk, i) => (
                          <a
                            key={i}
                            href={lk.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[12px] font-medium shadow-refero-sm transition-all"
                          >
                            <Link2 className="w-3 h-3 text-emerald-600" />
                            <span>{lk.title}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {hasAttachments && (
                      <div className="flex flex-wrap gap-2">
                        {update.attachments?.map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-[#f5efe9] text-[#4e080c] border border-[#4e080c]/[0.12] rounded-md text-[12px] font-medium shadow-refero-sm transition-all"
                          >
                            {renderAttachmentIcon(att.type)}
                            <span>{att.name}</span>
                            <Download className="w-3 h-3 text-[#71717A]" />
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11.5px] text-[#71717A] pt-1">
                      <span>Forum: {update.forum_name}</span>
                      <a
                        href={update.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#4e080c] font-medium hover:underline inline-flex items-center gap-1"
                      >
                        <span>View thread on Moodle</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {updates.length > 5 && (
            <div className="py-2.5 text-center">
              <button
                onClick={() => setShowAllUpdates(!showAllUpdates)}
                className="text-[12px] font-medium text-[#4e080c] hover:underline inline-flex items-center gap-1 py-0.5"
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
