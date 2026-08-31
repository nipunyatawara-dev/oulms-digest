import {
  CourseResourceItem,
  CourseSectionCategory,
  CourseSectionItem,
  ExamStudyGroup,
} from './types';

const GROUP_ORDER: ExamStudyGroup[] = [
  'ILS Sessions',
  'Core & Additional Reading',
  'Projects & Assessments',
  'Exam & Revision',
  'Course Foundations',
];

export const EXAM_STUDY_GROUPS = GROUP_ORDER;

export function inferStudyGroup(text: string, category?: CourseSectionCategory): ExamStudyGroup {
  const value = text.toLowerCase();

  if (
    category === 'exam' ||
    /\b(final\s+exam|exam(?:ination)?|model\s+(?:paper|answer)|past\s+paper|revision|review\s+session|mock\s+exam)\b/.test(value)
  ) {
    return 'Exam & Revision';
  }

  if (
    category === 'project' ||
    category === 'assessment' ||
    /\b(mini\s*project|project|assignment|quiz|\boq\b|\bcat\b|\btma\b|assessment|viva|submission)\b/.test(value)
  ) {
    return 'Projects & Assessments';
  }

  if (
    category === 'ils' ||
    /\bils\s*[-#]?\s*\d+\b|interactive\s+learning\s+session|lecture\s+session/.test(value)
  ) {
    return 'ILS Sessions';
  }

  if (
    category === 'readings' ||
    /\b(essential|additional|recommended|supplementary|reading|textbook|book|article|paper|presentation|slides?|reference|fundamentals?)\b/.test(value)
  ) {
    return 'Core & Additional Reading';
  }

  return 'Course Foundations';
}

export function getCourseSections(sections?: CourseSectionItem[]): CourseSectionItem[] {
  const countResources = (resources: CourseResourceItem[]): number =>
    resources.reduce((total, resource) => total + 1 + countResources(resource.children || []), 0);

  const normalizeResources = (
    resources: CourseResourceItem[],
    section: CourseSectionItem,
    sectionIndex: number,
    parentId = ''
  ): CourseResourceItem[] => resources.map((resource, resourceIndex) => {
    const id = resource.id || `${parentId || section.id || sectionIndex}-resource-${resourceIndex}`;
    const normalized: CourseResourceItem = {
      ...resource,
      id,
      section_title: resource.section_title || section.title,
      study_group:
        resource.study_group ||
        inferStudyGroup(
          `${section.title} ${resource.subsection || ''} ${resource.title} ${resource.description || ''}`,
          section.category
        ),
      is_exam_relevant: resource.is_exam_relevant !== false,
    };
    normalized.children = normalizeResources(resource.children || [], section, sectionIndex, id);
    return normalized;
  });

  return (sections || []).map((section, index) => {
    const studyGroup = section.study_group || inferStudyGroup(`${section.title} ${section.summary || ''}`, section.category);
    const resources = normalizeResources(section.resources || [], section, index);

    return {
      ...section,
      id: section.id || `section-${index}`,
      index: section.index ?? index,
      study_group: studyGroup,
      resources,
      resources_count: countResources(resources),
    };
  });
}

export function groupExamResources(sections?: CourseSectionItem[]) {
  const groups = new Map<ExamStudyGroup, CourseResourceItem[]>();
  GROUP_ORDER.forEach((group) => groups.set(group, []));

  getCourseSections(sections).forEach((section) => {
    const visit = (resource: CourseResourceItem) => {
      if (resource.is_exam_relevant) {
        const group = resource.study_group || section.study_group;
        groups.get(group)?.push({ ...resource, children: [] });
      }
      (resource.children || []).forEach(visit);
    };
    section.resources.forEach(visit);
  });

  return GROUP_ORDER.map((title) => ({ title, resources: groups.get(title) || [] })).filter(
    (group) => group.resources.length > 0
  );
}

export function countExamResources(sections?: CourseSectionItem[]) {
  return groupExamResources(sections).reduce((total, group) => total + group.resources.length, 0);
}
