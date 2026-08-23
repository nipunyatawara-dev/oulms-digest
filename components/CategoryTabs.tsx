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
    <div
      className="flex items-center gap-1.5 p-1.5 bg-[#4e080c]/[0.05] rounded-xl overflow-x-auto no-scrollbar max-w-full select-none"
      role="tablist"
      aria-label="Category Filters"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap flex items-center gap-2 min-h-[40px] active:scale-[0.98] ${
              isActive
                ? 'bg-white text-[#4e080c] shadow-refero-sm font-semibold'
                : 'text-[#71717A] hover:text-[#4e080c] hover:bg-[#4e080c]/[0.03]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-[#4e080c]/[0.08] text-[#4e080c]' : 'text-[#71717A] bg-[#4e080c]/[0.04]'
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

