export type AcademicCategory = 'Grades & Marks' | 'Viva & Exam' | 'Deadlines & Quizzes' | 'Announcements';

/**
 * Robustly categorizes notification or forum post title/text into one of the four academic categories:
 * - 'Grades & Marks': Eligibility, CA/OCAM, test marks, exam grades, results, evaluations
 * - 'Viva & Exam': Viva sessions, exam timetables, repeat/resit opportunities, exam schedules
 * - 'Deadlines & Quizzes': Assignment due dates, submission deadlines, quiz cutoffs
 * - 'Announcements': General course notices, workshops, lectures, broadcasts
 */
export function categorizeAcademicItem(text: string): AcademicCategory {
  if (!text) return 'Announcements';
  const lower = text.toLowerCase();

  // 1. Direct explicit indicators for Grades & Marks
  const gradeCoreKeywords = [
    'mark',
    'marks',
    'marked',
    'marking',
    're-marking',
    'remarking',
    're-check',
    'recheck',
    're-correction',
    'recorrection',
    're-evaluation',
    'reevaluation',
    're-scrutiniz',
    'rescrutiniz',
    'result',
    'results',
    'grade',
    'grades',
    'graded',
    'grading',
    'score',
    'scores',
    'scoring',
    'eligib', // covers eligibility, eligible, ineligible, etc.
    'continuous assessment',
    'transcript',
    'marksheet',
    'mark sheet',
    'grade sheet',
  ];

  const gradeCorePatterns = [
    /\bocam\b/i,
    /\bocams\b/i,
    /\bcam\b/i,
    /\bcams\b/i,
    /\bca\s*marks?\b/i,
    /\bgpa\b/i,
  ];

  const hasCoreGrade =
    gradeCoreKeywords.some((k) => lower.includes(k)) ||
    gradeCorePatterns.some((p) => p.test(lower));

  if (hasCoreGrade) {
    return 'Grades & Marks';
  }

  // 2. Deadlines & Quizzes keywords
  const deadlineKeywords = [
    'due',
    'deadline',
    'submission',
    'submit',
    'submitting',
    'resubmission',
    'cutoff',
    'cut-off',
    'assignment',
    'quiz',
    'activity due',
    'upcoming activities',
    'upcoming activity',
    'task due',
    'upload link',
  ];
  const hasDeadline = deadlineKeywords.some((k) => lower.includes(k));

  // 3. Viva & Exam keywords
  const vivaExamKeywords = [
    'viva',
    'exam',
    'examination',
    'resit',
    're-sit',
    'repeat',
    'timetable',
    'time table',
    'schedule',
    'time slot',
    'allocated time',
    'slot allocation',
    'session allocation',
    'venue',
    'exam center',
    'exam centre',
    'hall ticket',
    'admission card',
    'admission form',
    'index number',
    'opportunity',
    'final exam',
    'final examination',
  ];
  const hasVivaExam = vivaExamKeywords.some((k) => lower.includes(k));

  // Contextual abbreviation checks for CAT / OQ / TMA with word boundaries
  const evalAbbrPatterns = [
    /\bcat\b/i,
    /\bcats\b/i,
    /\bcat\s*[-#]?\s*\d+\b/i,
    /\boq\b/i,
    /\boqs\b/i,
    /\boq\s*[-#]?\s*\d+\b/i,
    /\btma\b/i,
    /\btmas\b/i,
    /\btma\s*[-#]?\s*\d+\b/i,
  ];
  const hasEvalAbbr = evalAbbrPatterns.some((p) => p.test(lower));

  if (hasEvalAbbr) {
    if (hasVivaExam) return 'Viva & Exam';
    if (hasDeadline) return 'Deadlines & Quizzes';
    return 'Grades & Marks';
  }

  if (hasVivaExam) {
    return 'Viva & Exam';
  }

  if (hasDeadline) {
    return 'Deadlines & Quizzes';
  }

  return 'Announcements';
}

/**
 * Extracts a numeric Moodle course or resource ID from a URL (e.g. /course/view.php?id=3439 -> 3439)
 */
export function getCourseIdFromUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/[?&]id=(\d+)/);
  return match ? match[1] : null;
}

/**
 * Constructs the direct user gradebook URL for a course
 */
export function getCourseGradebookUrl(courseUrlOrId?: string): string {
  if (!courseUrlOrId) return 'https://oulms.ou.ac.lk';
  if (/^\d+$/.test(courseUrlOrId)) {
    return `https://oulms.ou.ac.lk/grade/report/user/index.php?id=${courseUrlOrId}`;
  }
  const id = getCourseIdFromUrl(courseUrlOrId);
  if (id) {
    return `https://oulms.ou.ac.lk/grade/report/user/index.php?id=${id}`;
  }
  return courseUrlOrId;
}
