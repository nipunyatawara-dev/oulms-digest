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
    { id: 'Courses', label: 'Courses', count: counts.courses },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] rounded-lg overflow-x-auto no-scrollbar max-w-full select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1 rounded-md text-[12.5px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              isActive
                ? 'bg-white text-[#18181B] shadow-refero-sm'
                : 'text-[#71717A] hover:text-[#18181B] hover:bg-black/[0.02]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded font-normal ${
                  isActive ? 'bg-black/[0.06] text-[#18181B]' : 'text-[#71717A]'
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

