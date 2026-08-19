'use client';

import React from 'react';
import { ExternalLink, Award, Calendar, AlertCircle, Bell, BookOpen } from 'lucide-react';
import { NotificationItem } from '@/lib/types';

interface NotificationCardProps {
  notification: NotificationItem;
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'Grades & Marks':
        return {
          icon: Award,
          pillClass: 'bg-blue-50 text-blue-700 border-blue-200/60',
          dotClass: 'bg-blue-500',
        };
      case 'Viva & Exam':
        return {
          icon: Calendar,
          pillClass: 'bg-rose-50 text-rose-700 border-rose-200/60',
          dotClass: 'bg-rose-500',
        };
      case 'Deadlines & Quizzes':
        return {
          icon: AlertCircle,
          pillClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
          dotClass: 'bg-amber-500',
        };
      default:
        return {
          icon: Bell,
          pillClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
          dotClass: 'bg-zinc-400',
        };
    }
  };

  const config = getCategoryConfig(notification.category);
  const IconComponent = config.icon;

  const targetLink = notification.link && notification.link !== '#'
    ? notification.link
    : 'https://oulms.ou.ac.lk/message/output/popup/notifications.php';

  return (
    <a
      href={targetLink}
      target="_blank"
      rel="noreferrer"
      className="apple-btn group flex flex-col justify-between p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-black/[0.06] shadow-apple-sm hover:shadow-apple hover:border-[#0071E3]/30 transition-all cursor-pointer overflow-hidden min-h-[105px]"
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {/* Category Tag */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${config.pillClass} shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
              {notification.category}
            </span>

            {/* Course Tag */}
            {(notification.course_code || notification.course_name) && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 max-w-[220px] truncate shrink-0">
                <BookOpen className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {notification.course_code}
                  {notification.course_name ? ` • ${notification.course_name}` : ''}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 text-[#86868B]">
            {notification.time && (
              <span className="text-[11px] text-[#86868B]">
                {notification.time}
              </span>
            )}
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:text-[#0071E3] transition-opacity ml-1" />
          </div>
        </div>

        {/* Clean Title */}
        <h3 className="text-[13.5px] sm:text-[14px] font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors leading-snug break-words line-clamp-2">
          {notification.title}
        </h3>
      </div>
    </a>
  );
}
