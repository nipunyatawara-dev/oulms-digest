'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  CheckSquare,
  ExternalLink,
  RefreshCw,
  Search,
  Square,
} from 'lucide-react';
import { DiscoveredCourseItem, UserSettings } from '@/lib/types';

interface CourseSelectorViewProps {
  settings: UserSettings | null;
  availableCourses: DiscoveredCourseItem[];
  onSaveSettings: (settings: Partial<UserSettings>) => Promise<void>;
  onCrawlSelection: (courseCodes: string[]) => void;
  isSyncing: boolean;
}

function matchesSelection(courseCode: string, selectedCode: string) {
  const course = courseCode.toLowerCase();
  const selected = selectedCode.toLowerCase();
  return course === selected || course.startsWith(selected) || selected.startsWith(course);
}

function mergeCourses(...lists: DiscoveredCourseItem[][]) {
  const courses = new Map<string, DiscoveredCourseItem>();
  lists.flat().forEach((course) => {
    const key = course.url || course.code;
    if (course.code && !courses.has(key)) courses.set(key, course);
  });
  return Array.from(courses.values());
}

export function CourseSelectorView({
  settings,
  availableCourses,
  onSaveSettings,
  onCrawlSelection,
  isSyncing,
}: CourseSelectorViewProps) {
  const [courses, setCourses] = useState(() =>
    mergeCourses(availableCourses, settings?.discovered_courses || [])
  );
  const [selectedCourses, setSelectedCourses] = useState<string[]>(settings?.selected_courses || []);
  const [search, setSearch] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryMessage, setDiscoveryMessage] = useState('Preparing one-time course discovery...');
  const [discoveryError, setDiscoveryError] = useState('');
  const [saved, setSaved] = useState(false);
  const discoveryStarted = useRef(false);

  useEffect(() => {
    setCourses((current) => mergeCourses(current, availableCourses, settings?.discovered_courses || []));
    if (settings?.selected_courses) setSelectedCourses(settings.selected_courses);
  }, [availableCourses, settings]);

  const discoverCourses = () => {
    if (isDiscovering) return;
    setIsDiscovering(true);
    setDiscoveryError('');
    setDiscoveryMessage('Connecting to the course catalogue...');
    const params = new URLSearchParams();
    if (selectedCourses.length) params.set('courses', selectedCourses.join(','));
    const source = new EventSource(`/api/courses/discover?${params.toString()}`);

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'start' || payload.type === 'progress') {
        setDiscoveryMessage(payload.message);
      } else if (payload.type === 'done') {
        const discovered = Array.isArray(payload.courses) ? payload.courses : [];
        setCourses((current) => mergeCourses(discovered, current));
        setDiscoveryMessage(payload.message || `Found ${discovered.length} enrolled courses.`);
        setIsDiscovering(false);
        source.close();
      } else if (payload.type === 'error') {
        setDiscoveryError(payload.message || 'Course discovery failed.');
        setDiscoveryMessage('Using the last saved course catalogue.');
        setIsDiscovering(false);
        source.close();
      }
    };
    source.onerror = () => {
      setDiscoveryError('Course discovery connection closed before completion.');
      setDiscoveryMessage('Using the last saved course catalogue.');
      setIsDiscovering(false);
      source.close();
    };
  };

  useEffect(() => {
    if (discoveryStarted.current) return;
    discoveryStarted.current = true;
    discoverCourses();
    // Run once when this sidebar page opens; manual refresh remains available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSelected = (code: string) => selectedCourses.some((selected) => matchesSelection(code, selected));
  const selectedCourseCount = courses.filter((course) => isSelected(course.code)).length;

  const saveSelection = async (nextSelection: string[]) => {
    setSelectedCourses(nextSelection);
    setSaved(false);
    await onSaveSettings({ selected_courses: nextSelection });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const toggleCourse = (courseCode: string) => {
    const nextSelection = isSelected(courseCode)
      ? selectedCourses.filter((selected) => !matchesSelection(courseCode, selected))
      : [...selectedCourses, courseCode];
    void saveSelection(nextSelection);
  };

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter(
      (course) => course.code.toLowerCase().includes(query) || course.title.toLowerCase().includes(query)
    );
  }, [courses, search]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-[#f2ebe5] dark:bg-[#18181b] p-5 sm:p-6 border border-transparent dark:border-white/[0.08] shadow-refero-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#4e080c] text-white flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="text-[20px] font-semibold tracking-tight">Course Selector</h1>
                <p className="text-[12.5px] text-[#71717A] dark:text-[#a1a1aa]">
                  Choose which enrolled courses appear throughout your dashboard and future crawls.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#27272a] text-[12px] border border-[#4e080c]/[0.08] dark:border-white/[0.08]">
              {selectedCourseCount} selected
            </span>
            <button
              onClick={discoverCourses}
              disabled={isDiscovering}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-[#27272a] border border-[#4e080c]/[0.1] dark:border-white/[0.1] text-[12px] font-medium disabled:opacity-60 min-h-[40px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
              Refresh catalogue
            </button>
          </div>
        </div>

        <div className={`mt-4 rounded-xl px-3.5 py-3 text-[12px] ${discoveryError ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300' : 'bg-white/70 dark:bg-white/[0.05] text-[#71717A] dark:text-[#a1a1aa]'}`}>
          <div className="flex items-center gap-2">
            {isDiscovering ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>{discoveryError || discoveryMessage}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-[#f2ebe5] dark:bg-[#18181b] p-4 sm:p-5 border border-transparent dark:border-white/[0.08] shadow-refero-sm">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by course code or name..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#222226] border border-[#4e080c]/[0.08] dark:border-white/[0.08] text-[13px] outline-none min-h-[42px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void saveSelection(courses.map((course) => course.code))} className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-lg bg-white dark:bg-[#27272a] min-h-[40px]">
              <CheckSquare className="w-3.5 h-3.5" /> Select all
            </button>
            <button onClick={() => void saveSelection([])} className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-lg bg-white dark:bg-[#27272a] min-h-[40px]">
              <Square className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {filteredCourses.map((course) => {
            const selected = isSelected(course.code);
            return (
              <div key={`${course.code}-${course.url}`} className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${selected ? 'bg-white dark:bg-[#27272a] border-[#4e080c]/20 dark:border-white/20' : 'bg-white/40 dark:bg-white/[0.025] border-transparent'}`}>
                <button onClick={() => toggleCourse(course.code)} className="flex items-center gap-3 min-w-0 flex-1 text-left" aria-pressed={selected}>
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${selected ? 'bg-[#4e080c] border-[#4e080c] text-white' : 'border-[#4e080c]/25 dark:border-white/25'}`}>
                    {selected && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className="font-mono text-[11.5px] font-bold px-2 py-1 rounded-lg bg-[#4e080c]/[0.06] dark:bg-white/[0.07] shrink-0">{course.code}</span>
                  <span className="text-[13px] font-medium truncate">{course.title.replace(course.code, '').replace(/^[_:\-\s]+/, '') || course.title}</span>
                </button>
                <a href={course.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-[#71717A] hover:text-[#4e080c] dark:hover:text-white" aria-label={`Open ${course.code} in OUSL`}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}

          {!filteredCourses.length && (
            <div className="py-12 text-center text-[12.5px] text-[#71717A] dark:text-[#a1a1aa]">
              No courses match this search. The last saved catalogue remains available while discovery runs.
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-[#4e080c]/[0.08] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11.5px] text-[#71717A] dark:text-[#a1a1aa]">
            {saved ? 'Selection saved. The dashboard is filtered immediately.' : 'Selections auto-save in this browser and become the next crawl whitelist.'}
          </p>
          <button
            onClick={() => onCrawlSelection(selectedCourses)}
            disabled={isSyncing || selectedCourses.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4e080c] text-white text-[12.5px] font-semibold disabled:opacity-50 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Crawl selected courses
          </button>
        </div>
      </section>
    </div>
  );
}
