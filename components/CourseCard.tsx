'use client';

import React, { useState } from 'react';
import { ChevronDown, ExternalLink, User, Clock } from 'lucide-react';
import { CourseItem } from '@/lib/types';

interface CourseCardProps {
  course: CourseItem;
  defaultExpanded?: boolean;
}

export function CourseCard({ course, defaultExpanded = false }: CourseCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Grades & Marks':
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'Viva & Exam':
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
      case 'Deadlines & Quizzes':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const updates = course.updates || [];
  const displayedUpdates = showAllUpdates ? updates : updates.slice(0, 5);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-apple-sm overflow-hidden transition-all">
      {/* Course Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-black/[0.01] transition-colors select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white font-mono font-bold text-[12px] tracking-wide shrink-0 shadow-sm">
            {course.code}
          </div>
          <div className="min-w-0">
            <h3 className="text-[14.5px] font-semibold text-[#1D1D1F] truncate">
              {course.title.replace(course.code, '').trim() || course.title}
            </h3>
            <p className="text-[12px] text-[#86868B] flex items-center gap-2 mt-0.5">
              <span>{course.updates_count} discussions</span>
              <span>&bull;</span>
              <a
                href={course.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[#0071E3] hover:underline inline-flex items-center gap-1 font-medium"
              >
                Open in Moodle <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {course.updates_count > 0 && (
            <span className="text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
              {course.updates_count}
            </span>
          )}
          <div className={`p-1 text-[#86868B] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Expanded Discussions List */}
      {expanded && (
        <div className="border-t border-black/[0.06] bg-[#FBFBFC] px-4 py-1 divide-y divide-black/[0.04]">
          {updates.length > 0 ? (
            <>
              {displayedUpdates.map((update) => (
                <div key={update.id} className="py-3 flex items-start justify-between gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10.5px] font-semibold px-2 py-0.2 rounded-md border ${getCategoryBadge(update.category)}`}>
                        {update.category}
                      </span>
                      {update.forum_name && (
                        <span className="text-[11px] text-[#86868B] truncate max-w-[240px]">
                          {update.forum_name}
                        </span>
                      )}
                    </div>
                    <a
                      href={update.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13.5px] font-semibold text-[#1D1D1F] hover:text-[#0071E3] transition-colors leading-snug block break-words"
                    >
                      {update.topic}
                    </a>
                    <div className="flex items-center gap-3 text-[11px] text-[#86868B] mt-1 flex-wrap">
                      {update.author && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {update.author}
                        </span>
                      )}
                      {update.time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {update.time}
                        </span>
                      )}
                    </div>
                  </div>

                  <a
                    href={update.link}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-[#86868B] group-hover:text-[#0071E3] group-hover:bg-black/[0.04] transition-colors shrink-0"
                    title="Open topic in Moodle"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}

              {updates.length > 5 && (
                <div className="py-2.5 text-center">
                  <button
                    onClick={() => setShowAllUpdates(!showAllUpdates)}
                    className="text-[12px] font-semibold text-[#0071E3] hover:underline inline-flex items-center gap-1 py-0.5"
                  >
                    {showAllUpdates ? 'Show fewer discussions' : `Show all ${updates.length} discussions`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-center text-[12px] text-[#86868B]">
              No announcements found in this course.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
