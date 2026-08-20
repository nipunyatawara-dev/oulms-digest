'use client';

import React from 'react';
import { ExternalLink, Award, Calendar, AlertCircle, Bell, BookOpen } from 'lucide-react';
import { NotificationItem } from '@/lib/types';

interface NotificationCardProps {
  notification: NotificationItem;
}

export function NotificationCard({ notification }: NotificationCardProps) {
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

  const targetLink = notification.link && notification.link !== '#'
    ? notification.link
    : 'https://oulms.ou.ac.lk/message/output/popup/notifications.php';

  return (
    <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#4e080c]/[0.015] transition-colors group">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Left Monochrome Icon */}
        <div className="w-8 h-8 rounded-lg bg-[#4e080c]/[0.05] text-[#4e080c] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <IconComponent className="w-4 h-4 text-[#4e080c]" />
        </div>

        {/* Center Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={targetLink}
              target="_blank"
              rel="noreferrer"
              className="text-[13.5px] sm:text-[14px] font-semibold text-[#4e080c] hover:text-[#620a0f] transition-colors leading-snug break-words"
            >
              {notification.title}
            </a>
          </div>

          <div className="text-[12px] text-[#71717A] flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="font-medium text-[#4e080c]">
              {notification.category}
            </span>
            {(notification.course_code || notification.course_name) && (
              <>
                <span>&bull;</span>
                <span className="truncate max-w-[200px] sm:max-w-xs">
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

      {/* Right Action Button */}
      <div className="shrink-0">
        <a
          href={targetLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-[12.5px] font-medium text-[#4e080c] bg-white hover:bg-[#f5efe9] border border-[#4e080c]/[0.12] rounded-lg shadow-refero-sm transition-all"
        >
          <span>Open</span>
          <ExternalLink className="w-3 h-3 text-[#71717A]" />
        </a>
      </div>
    </div>
  );
}

