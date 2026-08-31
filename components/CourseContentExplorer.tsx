'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  CirclePlay,
  ClipboardCheck,
  ExternalLink,
  File,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers,
  Link2,
  MessageSquare,
  NotebookTabs,
  Presentation,
} from 'lucide-react';
import { CourseItem, CourseResourceItem, CourseSectionItem } from '@/lib/types';
import { countExamResources, getCourseSections, groupExamResources } from '@/lib/courseContent';

function ResourceIcon({ resource }: { resource: CourseResourceItem }) {
  const iconClass = 'w-4 h-4 shrink-0';
  if (resource.kind === 'recording') return <CirclePlay className={`${iconClass} text-purple-600 dark:text-purple-400`} />;
  if (resource.kind === 'assignment' || resource.kind === 'quiz') return <ClipboardCheck className={`${iconClass} text-amber-700 dark:text-amber-400`} />;
  if (resource.kind === 'forum') return <MessageSquare className={`${iconClass} text-blue-700 dark:text-blue-400`} />;
  if (resource.kind === 'folder') return <FolderOpen className={`${iconClass} text-indigo-700 dark:text-indigo-400`} />;
  if (resource.kind === 'book' || resource.kind === 'lesson') return <BookOpen className={`${iconClass} text-emerald-700 dark:text-emerald-400`} />;
  if (resource.kind === 'page') return <NotebookTabs className={`${iconClass} text-cyan-700 dark:text-cyan-400`} />;
  if (resource.kind === 'url') return <Link2 className={`${iconClass} text-emerald-700 dark:text-emerald-400`} />;
  if (resource.kind === 'file') {
    const isPresentation = /\b(slides?|presentation|pptx?)\b/i.test(`${resource.title} ${resource.file_type || ''}`);
    return isPresentation ? (
      <Presentation className={`${iconClass} text-rose-700 dark:text-rose-400`} />
    ) : (
      <FileText className={`${iconClass} text-rose-700 dark:text-rose-400`} />
    );
  }
  return <File className={`${iconClass} text-[#71717A] dark:text-[#a1a1aa]`} />;
}

function ResourceRow({ resource, showChildren = true }: { resource: CourseResourceItem; showChildren?: boolean }) {
  if (resource.kind === 'label' && !resource.url) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-[#4e080c]/[0.06] dark:border-white/[0.08] bg-[#4e080c]/[0.035] dark:bg-white/[0.04] px-3.5 py-3">
          <div className="text-[12.5px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">{resource.title}</div>
          {resource.description && resource.description !== resource.title && (
            <p className="mt-1 text-[12px] leading-relaxed text-[#71717A] dark:text-[#a1a1aa] whitespace-pre-line">
              {resource.description}
            </p>
          )}
        </div>
        {showChildren && !!resource.children?.length && (
          <div className="ml-4 pl-3 border-l border-[#4e080c]/[0.12] dark:border-white/[0.12] space-y-2">
            {resource.children.map((child) => <ResourceRow key={child.id} resource={child} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <a
        href={resource.url || '#'}
        target="_blank"
        rel="noreferrer"
        className="group flex items-start justify-between gap-3 rounded-xl border border-[#4e080c]/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1f1f23] px-3.5 py-3 hover:bg-[#f5efe9] dark:hover:bg-[#27272a] transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#4e080c]/[0.05] dark:bg-white/[0.07] flex items-center justify-center shrink-0">
            <ResourceIcon resource={resource} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[#4e080c] dark:text-[#f4f4f5] leading-snug">
              {resource.title}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[10.5px] uppercase tracking-wide text-[#71717A] dark:text-[#a1a1aa]">
              <span>{resource.kind}</span>
              {!!resource.children?.length && <span>{resource.children.length} nested items</span>}
              {resource.availability && <span className="normal-case tracking-normal truncate">{resource.availability}</span>}
            </div>
            {resource.description && (
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#71717A] dark:text-[#a1a1aa] line-clamp-3">
                {resource.description}
              </p>
            )}
          </div>
        </div>
        <ExternalLink className="w-3.5 h-3.5 mt-1 shrink-0 text-[#8E8E93] group-hover:text-[#4e080c] dark:group-hover:text-white" />
      </a>
      {showChildren && !!resource.children?.length && (
        <div className="ml-4 pl-3 border-l border-[#4e080c]/[0.12] dark:border-white/[0.12] space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#71717A] dark:text-[#a1a1aa]">
            Inside {resource.title}
          </div>
          {resource.children.map((child) => <ResourceRow key={child.id} resource={child} />)}
        </div>
      )}
    </div>
  );
}

function SectionResources({ section }: { section: CourseSectionItem }) {
  const resourceGroups = useMemo(() => {
    const groups = new Map<string, CourseResourceItem[]>();
    section.resources.forEach((resource) => {
      const key = resource.subsection || 'Section Resources';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(resource);
    });
    return Array.from(groups.entries());
  }, [section]);

  return (
    <div className="space-y-5">
      {resourceGroups.map(([subsection, resources]) => (
        <section key={subsection} className="space-y-2.5">
          {(resourceGroups.length > 1 || subsection !== 'Section Resources') && (
            <div className="flex items-center gap-2 px-0.5">
              <div className="h-px flex-1 bg-[#4e080c]/[0.08] dark:bg-white/[0.08]" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#71717A] dark:text-[#a1a1aa]">
                {subsection}
              </h3>
              <div className="h-px flex-1 bg-[#4e080c]/[0.08] dark:bg-white/[0.08]" />
            </div>
          )}
          <div className="space-y-2">
            {resources
              .filter((resource) => !(resource.kind === 'label' && resource.title === subsection && resource.description === resource.title))
              .map((resource) => <ResourceRow key={resource.id} resource={resource} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

interface CourseDetailViewProps {
  course: CourseItem;
  onBack: () => void;
}

export function CourseDetailView({ course, onBack }: CourseDetailViewProps) {
  const sections = useMemo(() => getCourseSections(course.sections), [course.sections]);
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || '');

  useEffect(() => {
    setActiveSectionId(sections[0]?.id || '');
  }, [course.code, sections]);

  const activeSection = sections.find((section) => section.id === activeSectionId) || sections[0];

  return (
    <div className="space-y-5">
      <div className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl p-5 sm:p-6 border border-transparent dark:border-white/[0.08] shadow-refero-sm">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#71717A] dark:text-[#a1a1aa] hover:text-[#4e080c] dark:hover:text-white mb-4 min-h-[36px]">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to enrolled courses
        </button>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex px-2.5 py-1 rounded-lg bg-[#4e080c] text-white font-mono text-[11.5px] font-bold mb-2">
              {course.code}
            </div>
            <h1 className="text-[20px] sm:text-[24px] font-semibold tracking-tight text-[#4e080c] dark:text-[#f4f4f5]">
              {course.title.replace(course.code, '').trim() || course.title}
            </h1>
            <p className="mt-1 text-[12.5px] text-[#71717A] dark:text-[#a1a1aa]">
              Full Moodle course map with sections, learning material, activities, and assessments.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="px-3 py-1.5 bg-white dark:bg-[#27272a] rounded-lg border border-[#4e080c]/[0.08] dark:border-white/[0.08]">{sections.length} sections</span>
            <span className="px-3 py-1.5 bg-white dark:bg-[#27272a] rounded-lg border border-[#4e080c]/[0.08] dark:border-white/[0.08]">{course.resources_count || 0} resources</span>
          </div>
        </div>
      </div>

      {sections.length > 0 && activeSection ? (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-5 items-start">
          <aside className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl p-2.5 border border-transparent dark:border-white/[0.08] lg:sticky lg:top-24 max-h-[70vh] overflow-y-auto">
            {sections.map((section) => (
              <button key={section.id} onClick={() => setActiveSectionId(section.id)} className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${activeSection.id === section.id ? 'bg-white dark:bg-[#27272a] text-[#4e080c] dark:text-white shadow-refero-sm' : 'text-[#71717A] dark:text-[#a1a1aa] hover:bg-white/60 dark:hover:bg-white/[0.05]'}`}>
                <span className="text-[12.5px] font-medium leading-snug">{section.title}</span>
                <span className="text-[10.5px] shrink-0">{section.resources_count}</span>
              </button>
            ))}
          </aside>

          <section className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl p-5 sm:p-6 border border-transparent dark:border-white/[0.08] shadow-refero-sm min-w-0">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#71717A] dark:text-[#a1a1aa] mb-1">{activeSection.study_group}</div>
                <h2 className="text-[17px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">{activeSection.title}</h2>
                {activeSection.summary && <p className="mt-2 text-[12.5px] leading-relaxed text-[#71717A] dark:text-[#a1a1aa] whitespace-pre-line">{activeSection.summary}</p>}
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-[#27272a] shrink-0">{activeSection.resources_count} items</span>
            </div>
            <SectionResources section={activeSection} />
          </section>
        </div>
      ) : (
        <div className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl p-12 text-center border border-transparent dark:border-white/[0.08]">
          <Layers className="w-7 h-7 mx-auto text-[#71717A] dark:text-[#a1a1aa] mb-2" />
          <h2 className="text-[14px] font-semibold">Course content is waiting for the next crawl</h2>
          <p className="mt-1 text-[12px] text-[#71717A] dark:text-[#a1a1aa]">The existing announcements remain available. Run the updated crawler to index Moodle sections and resources.</p>
        </div>
      )}
    </div>
  );
}

interface ExamPreparationViewProps {
  courses: CourseItem[];
}

export function ExamPreparationView({ courses }: ExamPreparationViewProps) {
  const preparedCourses = useMemo(
    () => courses.filter((course) => countExamResources(course.sections) > 0),
    [courses]
  );
  const [selectedCode, setSelectedCode] = useState(preparedCourses[0]?.code || courses[0]?.code || '');

  useEffect(() => {
    if (!courses.some((course) => course.code === selectedCode)) {
      setSelectedCode(preparedCourses[0]?.code || courses[0]?.code || '');
    }
  }, [courses, preparedCourses, selectedCode]);

  const selectedCourse = courses.find((course) => course.code === selectedCode) || preparedCourses[0] || courses[0];
  const groups = groupExamResources(selectedCourse?.sections);

  return (
    <div className="space-y-5">
      <div className="bg-[#4e080c] text-white rounded-2xl p-5 sm:p-7 shadow-refero-sm">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-5 h-5" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">Semester-end study workspace</span>
        </div>
        <h1 className="text-[22px] sm:text-[27px] font-semibold tracking-tight">Exam Preparation</h1>
        <p className="mt-1.5 max-w-2xl text-[12.5px] sm:text-[13px] leading-relaxed text-white/75">
          Review every indexed ILS session, core reading, project, assessment, model paper, and revision resource course by course.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-5 items-start">
        <aside className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl p-3 border border-transparent dark:border-white/[0.08] lg:sticky lg:top-24">
          <div className="px-2 py-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#71717A] dark:text-[#a1a1aa]">Subjects</div>
          <div className="space-y-1">
            {courses.map((course) => {
              const count = countExamResources(course.sections);
              const active = selectedCourse?.code === course.code;
              return (
                <button key={course.id} onClick={() => setSelectedCode(course.code)} className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${active ? 'bg-white dark:bg-[#27272a] text-[#4e080c] dark:text-white shadow-refero-sm' : 'text-[#71717A] dark:text-[#a1a1aa] hover:bg-white/60 dark:hover:bg-white/[0.05]'}`}>
                  <div className="min-w-0">
                    <div className="font-mono text-[11.5px] font-bold">{course.code}</div>
                    <div className="text-[10.5px] truncate">{course.title.replace(course.code, '').trim()}</div>
                  </div>
                  <span className="text-[10px] shrink-0">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-4 min-w-0">
          {selectedCourse && (
            <div className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl p-5 border border-transparent dark:border-white/[0.08]">
              <div className="font-mono text-[11px] font-bold text-[#71717A] dark:text-[#a1a1aa]">{selectedCourse.code}</div>
              <h2 className="mt-1 text-[17px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">{selectedCourse.title.replace(selectedCourse.code, '').trim() || selectedCourse.title}</h2>
              <p className="mt-1 text-[12px] text-[#71717A] dark:text-[#a1a1aa]">{countExamResources(selectedCourse.sections)} study resources grouped from the live Moodle course structure.</p>
            </div>
          )}

          {groups.length > 0 ? groups.map((group) => {
            const bySection = new Map<string, Map<string, CourseResourceItem[]>>();
            group.resources.forEach((resource) => {
              const sectionTitle = resource.section_title || 'Course Material';
              const subsectionTitle = resource.subsection || 'Section Resources';
              if (!bySection.has(sectionTitle)) bySection.set(sectionTitle, new Map());
              const subsections = bySection.get(sectionTitle);
              if (!subsections?.has(subsectionTitle)) subsections?.set(subsectionTitle, []);
              subsections?.get(subsectionTitle)?.push(resource);
            });
            return (
              <section key={group.title} className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl p-5 sm:p-6 border border-transparent dark:border-white/[0.08] shadow-refero-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-[15px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">{group.title}</h2>
                  <span className="text-[10.5px] px-2.5 py-1 rounded-full bg-white dark:bg-[#27272a]">{group.resources.length}</span>
                </div>
                <div className="space-y-5">
                  {Array.from(bySection.entries()).map(([sectionTitle, subsections]) => (
                    <div key={sectionTitle} className="space-y-2">
                      <div className="flex items-center gap-2 text-[12px] font-semibold text-[#4e080c] dark:text-[#f4f4f5]">
                        <ChevronRight className="w-3.5 h-3.5" />
                        {sectionTitle}
                      </div>
                      <div className="space-y-4 pl-0 sm:pl-5">
                        {Array.from(subsections.entries()).map(([subsectionTitle, resources]) => (
                          <div key={subsectionTitle} className="space-y-2">
                            {(subsections.size > 1 || subsectionTitle !== 'Section Resources') && (
                              <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#71717A] dark:text-[#a1a1aa]">
                                {subsectionTitle}
                              </div>
                            )}
                            {resources.map((resource) => <ResourceRow key={resource.id} resource={resource} showChildren={false} />)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }) : (
            <div className="bg-[#f2ebe5] dark:bg-[#18181b] rounded-2xl p-12 text-center border border-transparent dark:border-white/[0.08]">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 text-[#71717A] dark:text-[#a1a1aa]" />
              <h2 className="text-[14px] font-semibold">Exam resources will appear after the next crawl</h2>
              <p className="mt-1 text-[12px] text-[#71717A] dark:text-[#a1a1aa]">The updated crawler will classify ILS sessions, readings, projects, assessments, and final-exam material automatically.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
