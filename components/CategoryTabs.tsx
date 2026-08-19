'use client';

import React from 'react';

export type CategoryFilter = 'All' | 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Courses';

interface CategoryTabsProps {
  activeTab: CategoryFilter;
  onChange: (tab: CategoryFilter) => void;
  counts: {
    all: number;
    grades: number;
    viva: number;
    deadlines: number;
    courses: number;
  };
}

export function CategoryTabs({ activeTab, onChange, counts }: CategoryTabsProps) {
  const tabs: { id: CategoryFilter; label: string; count: number }[] = [
    { id: 'All', label: 'All Updates', count: counts.all },
    { id: 'Grades & Marks', label: 'Grades & Marks', count: counts.grades },
    { id: 'Viva & Exam', label: 'Viva & Exams', count: counts.viva },
    { id: 'Deadlines & Quizzes', label: 'Deadlines', count: counts.deadlines },
    { id: 'Courses', label: 'Enrolled Courses', count: counts.courses },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] rounded-xl overflow-x-auto no-scrollbar max-w-full">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`apple-btn px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              isActive
                ? 'bg-white text-[#1D1D1F] shadow-apple-sm font-semibold'
                : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-white/40'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive ? 'bg-black/[0.07] text-[#1D1D1F]' : 'bg-black/[0.04] text-[#86868B]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
