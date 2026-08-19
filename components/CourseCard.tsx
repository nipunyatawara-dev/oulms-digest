'use client';

import React, { useState } from 'react';
import { ChevronDown, ExternalLink, User, Clock, MessageSquare } from 'lucide-react';
import { CourseItem } from '@/lib/types';

interface CourseCardProps {
  course: CourseItem;
  defaultExpanded?: boolean;
}

export function CourseCard({ course, defaultExpanded = false }: CourseCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const updates = course.updates || [];
  const displayedUpdates = showAllUpdates ? updates : updates.slice(0, 5);

  return (
    <div className="hover:bg-black/[0.015] transition-colors">
      {/* Course Main Row */}
      <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 sm:gap-4 select-none">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* Left Course Code Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-[#18181B] text-white font-mono font-semibold text-[11.5px] tracking-wide shrink-0 shadow-refero-sm mt-0.5 sm:mt-0">
            {course.code}
          </div>

          {/* Center Info */}
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-[#18181B] truncate">
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
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-[12.5px] font-medium text-[#18181B] bg-white hover:bg-[#F9F9F7] border border-black/[0.08] rounded-lg shadow-refero-sm transition-all"
            title="Open in Moodle"
          >
            <span>Moodle</span>
            <ExternalLink className="w-3 h-3 text-[#71717A]" />
          </a>

          {updates.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[12.5px] font-medium text-[#18181B] bg-white hover:bg-[#F9F9F7] border border-black/[0.08] rounded-lg shadow-refero-sm transition-all"
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
        <div className="border-t border-black/[0.04] bg-[#F7F7F4] px-4 sm:px-6 py-2 divide-y divide-black/[0.04]">
          {displayedUpdates.map((update) => (
            <div
              key={update.id}
              className="py-3 flex items-start justify-between gap-3 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-black/[0.05] text-[#18181B]">
                    {update.category}
                  </span>
                  {update.forum_name && (
                    <span className="text-[11.5px] text-[#71717A] truncate max-w-[220px]">
                      {update.forum_name}
                    </span>
                  )}
                </div>

                <a
                  href={update.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] font-medium text-[#18181B] hover:underline leading-snug block break-words"
                >
                  {update.topic}
                </a>

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

              <a
                href={update.link}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.04] transition-colors shrink-0"
                title="Open topic in Moodle"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}

          {updates.length > 5 && (
            <div className="py-2.5 text-center">
              <button
                onClick={() => setShowAllUpdates(!showAllUpdates)}
                className="text-[12px] font-medium text-[#18181B] hover:underline inline-flex items-center gap-1 py-0.5"
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

