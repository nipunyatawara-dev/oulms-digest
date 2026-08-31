import asyncio
import datetime
import json
import os
import re
import sys
import argparse
from typing import Dict, List, Tuple, Optional
from urllib.parse import urldefrag, urlparse
from playwright.async_api import async_playwright
from state_manager import StateManager

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
LMS_DATA_FILE = os.path.join(DATA_DIR, "lms_data.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")

LOGIN_URL = "https://oulms.ou.ac.lk/login/index.php"
COURSES_URL = "https://oulms.ou.ac.lk/my/courses.php"
NOTIFICATIONS_URL = "https://oulms.ou.ac.lk/message/output/popup/notifications.php"

# Default fallback target course whitelist
DEFAULT_TARGET_COURSE_CODES = [
    "AGM4367",
    "EEI4267",
    "EEI4360",
    "EEI4361",
    "EEI4362",
    "EER4189",
    "BSE"
]

COURSE_NAMES_DICT = {
    "AGM4367": "Economics and Marketing for Engineering",
    "EEI4267": "Requirement Engineering",
    "EEI4360": "Introduction to Artificial Intelligence",
    "EEI4361": "User Experience Engineering",
    "EEI4362": "Object Oriented Design",
    "EER4189": "Software Design in Group",
    "BSE": "BSE Learner Support 2024/2025",
}

def log_progress(percent: int, message: str):
    print(f"[PROGRESS:{percent}] {message}", flush=True)

def load_settings() -> Dict:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[!] Warning: Could not read settings.json: {e}")
    return {}

def save_settings(settings: Dict):
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)
    except Exception as e:
        print(f"[!] Warning: Could not save settings.json: {e}")

def clean_title_text(title: str, course_code: str = "", course_names: Dict[str, str] = None) -> str:
    cleaned = title.strip()
    cleaned = re.sub(r'^[A-Z]{3,4}\d{4}[A-Za-z0-9_]*:\s*', '', cleaned)
    cleaned = re.sub(r'^[A-Z]{3,4}\d{4}\s+[^:]+:\s*', '', cleaned)
    
    names_dict = {**COURSE_NAMES_DICT, **(course_names or {})}
    for code, name in names_dict.items():
        if cleaned.startswith(f"{code} {name}"):
            cleaned = cleaned[len(f"{code} {name}"):].strip()
        elif cleaned.startswith(f"{code}:"):
            cleaned = cleaned[len(f"{code}:"):].strip()
        elif cleaned.startswith(code):
            cleaned = cleaned[len(code):].strip()
    
    cleaned = re.sub(r'^[_\-:\s]+', '', cleaned).strip()
    return cleaned if cleaned else title

def categorize_notification(text: str) -> str:
    if not text:
        return "Announcements"
    lower = text.lower()

    # 1. Direct explicit indicators for Grades & Marks
    grade_core_keywords = [
        "mark", "marks", "marked", "marking", "re-marking", "remarking",
        "re-check", "recheck", "re-correction", "recorrection",
        "re-evaluation", "reevaluation", "re-scrutiniz", "rescrutiniz",
        "result", "results",
        "grade", "grades", "graded", "grading",
        "score", "scores", "scoring",
        "eligib",  # covers eligibility, eligible, ineligible, etc.
        "continuous assessment",
        "transcript", "marksheet", "mark sheet", "grade sheet"
    ]

    grade_core_patterns = [
        r"\bocam\b", r"\bocams\b",
        r"\bcam\b", r"\bcams\b",
        r"\bca\s*marks?\b",
        r"\bgpa\b"
    ]

    has_core_grade = any(k in lower for k in grade_core_keywords) or any(re.search(p, lower) for p in grade_core_patterns)

    if has_core_grade:
        return "Grades & Marks"

    # 2. Deadlines & Quizzes keywords
    deadline_keywords = [
        "due", "deadline", "submission", "submit", "submitting", "resubmission",
        "cutoff", "cut-off", "assignment", "quiz", "activity due",
        "upcoming activities", "upcoming activity", "task due", "upload link"
    ]
    has_deadline = any(k in lower for k in deadline_keywords)

    # 3. Viva & Exam keywords
    viva_exam_keywords = [
        "viva", "exam", "examination", "resit", "re-sit", "repeat",
        "timetable", "time table", "schedule", "time slot", "allocated time",
        "slot allocation", "session allocation", "venue", "exam center", "exam centre",
        "hall ticket", "admission card", "admission form", "index number",
        "opportunity", "final exam", "final examination"
    ]
    has_viva_exam = any(k in lower for k in viva_exam_keywords)

    # Contextual abbreviation checks for CAT / OQ / TMA with word boundaries
    abbr_patterns = [
        r"\bcat\b", r"\bcats\b", r"\bcat\s*[-#]?\s*\d+\b",
        r"\boq\b", r"\boqs\b", r"\boq\s*[-#]?\s*\d+\b",
        r"\btma\b", r"\btmas\b", r"\btma\s*[-#]?\s*\d+\b",
    ]
    has_eval_abbr = any(re.search(p, lower) for p in abbr_patterns)

    if has_eval_abbr:
        if has_viva_exam:
            return "Viva & Exam"
        if has_deadline:
            return "Deadlines & Quizzes"
        return "Grades & Marks"

    if has_viva_exam:
        return "Viva & Exam"

    if has_deadline:
        return "Deadlines & Quizzes"

    return "Announcements"

def classify_attachment_type(filename_or_url: str) -> str:
    lower = filename_or_url.lower()
    if lower.endswith(('.xlsx', '.xls', '.xlsm')):
        return 'excel'
    if lower.endswith('.csv'):
        return 'csv'
    if lower.endswith('.pdf'):
        return 'pdf'
    if lower.endswith(('.doc', '.docx')):
        return 'doc'
    if lower.endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif')):
        return 'image'
    return 'other'

def classify_link_type(url: str) -> str:
    lower = url.lower()
    if 'docs.google.com/spreadsheets' in lower or 'sheets.google.com' in lower:
        return 'sheets'
    if 'drive.google.com' in lower:
        return 'drive'
    if 'forms.gle' in lower or 'docs.google.com/forms' in lower or 'forms.office.com' in lower:
        return 'forms'
    if 'zoom.us' in lower or 'teams.microsoft.com' in lower or 'meet.google.com' in lower:
        return 'zoom'
    return 'general'

def classify_course_section(text: str) -> str:
    lower = (text or "").lower()
    if re.search(r'\b(final\s+exam|exam(?:ination)?|model\s+(?:paper|answer)|past\s+paper|revision|mock\s+exam)\b', lower):
        return "exam"
    if re.search(r'\b(mini\s*project|project|capstone)\b', lower):
        return "project"
    if re.search(r'\b(assignment|quiz|\boq\b|\bcat\b|\btma\b|assessment|viva|submission)\b', lower):
        return "assessment"
    if re.search(r'\bils\s*[-#]?\s*\d+\b|interactive\s+learning\s+session|lecture\s+session', lower):
        return "ils"
    if re.search(r'\b(essential|additional|recommended|supplementary|reading|textbook|book|article|paper|presentation|slides?|reference|fundamentals?)\b', lower):
        return "readings"
    if re.search(r'\b(introduction|orientation|welcome|announcement|course\s+communication|help\s+wanted|introduce\s+yourself|icebreaker|general\s+information|start\s+here)\b', lower):
        return "orientation"
    return "general"

def get_exam_study_group(text: str, section_category: str = "general") -> str:
    lower = (text or "").lower()
    if section_category == "exam" or re.search(r'\b(final\s+exam|exam(?:ination)?|model\s+(?:paper|answer)|past\s+paper|revision|mock\s+exam)\b', lower):
        return "Exam & Revision"
    if section_category in ("project", "assessment") or re.search(r'\b(mini\s*project|project|assignment|quiz|\boq\b|\bcat\b|\btma\b|assessment|viva|submission)\b', lower):
        return "Projects & Assessments"
    if section_category == "ils" or re.search(r'\bils\s*[-#]?\s*\d+\b|interactive\s+learning\s+session|lecture\s+session', lower):
        return "ILS Sessions"
    if section_category == "readings" or re.search(r'\b(essential|additional|recommended|supplementary|reading|textbook|book|article|paper|presentation|slides?|reference|fundamentals?)\b', lower):
        return "Core & Additional Reading"
    return "Course Foundations"

def classify_course_resource(url: str, title: str = "", hint: str = "") -> str:
    lower = f"{url} {title} {hint}".lower()
    if re.search(r'\.(pdf|ppt|pptx|doc|docx|xls|xlsx|csv|zip)(?:\?|$)', lower) or 'pluginfile.php' in lower or '/mod/resource/' in lower:
        return "file"
    if '/mod/assign/' in lower:
        return "assignment"
    if '/mod/quiz/' in lower:
        return "quiz"
    if '/mod/forum/' in lower:
        return "forum"
    if '/mod/folder/' in lower:
        return "folder"
    if '/mod/book/' in lower:
        return "book"
    if '/mod/lesson/' in lower:
        return "lesson"
    if re.search(r'\b(recording|recorded|zoom|teams|meet|youtube|video)\b', lower):
        return "recording"
    if '/mod/page/' in lower:
        return "page"
    if '/mod/url/' in lower:
        return "url"
    if not url:
        return "label"
    return "other"

def is_exam_relevant_resource(text: str, kind: str, study_group: str) -> bool:
    lower = (text or "").lower()
    if study_group != "Course Foundations":
        return True
    if re.search(r'\b(announcement|help\s+wanted|introduce\s+yourself|icebreaker|general\s+forum|news\s+forum|attendance|course\s+evaluation|feedback|contact\s+information|start\s+here)\b', lower):
        return False
    if kind == "forum":
        return False
    return True

def count_course_resources(resources: List[Dict]) -> int:
    return sum(1 + count_course_resources(resource.get("children", [])) for resource in resources)

def extract_course_code_and_name(text: str, course_map: Dict[str, str], target_codes: List[str] = None) -> Tuple[str, str]:
    targets = target_codes or DEFAULT_TARGET_COURSE_CODES
    for target in targets:
        if target.lower() in text.lower():
            name = course_map.get(target) or COURSE_NAMES_DICT.get(target, "")
            return target, name

    match = re.search(r'([A-Z]{3,4}\d{4})', text)
    if match:
        code = match.group(1)
        name = course_map.get(code) or COURSE_NAMES_DICT.get(code, "")
        return code, name

    return "", ""

class OUSLCrawler:
    def __init__(
        self,
        username: str,
        password: str,
        state_manager: StateManager = None,
        filter_seen: bool = False,
        target_courses: Optional[List[str]] = None
    ):
        self.username = username
        self.password = password
        self.state_manager = state_manager or StateManager(os.path.join(DATA_DIR, "seen_items.json"))
        self.filter_seen = filter_seen
        
        # Determine target courses
        if target_courses is not None:
            self.target_courses = target_courses
        else:
            env_courses = os.getenv("SELECTED_COURSES")
            if env_courses:
                self.target_courses = [c.strip() for c in env_courses.split(",") if c.strip()]
            else:
                settings = load_settings()
                self.target_courses = settings.get("selected_courses") or DEFAULT_TARGET_COURSE_CODES

        self.course_map: Dict[str, str] = {}
        self.course_url_map: Dict[str, str] = {}

    async def discover_courses(self) -> Dict:
        """Logs into OUSL Moodle and extracts all enrolled courses without full forum crawling."""
        os.makedirs(DATA_DIR, exist_ok=True)
        log_progress(10, "Launching browser for course discovery...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                ignore_https_errors=True
            )
            page = await context.new_page()

            log_progress(25, "Connecting to OUSL IAM Keycloak server...")
            logged_in = await self._login(page)
            if not logged_in:
                log_progress(100, "Authentication failed. Check your student credentials.")
                await browser.close()
                return {"error": "Authentication failed", "success": False, "courses": []}

            log_progress(60, "Logged in. Discovering all enrolled courses from Moodle...")
            discovered = await self._scrape_all_enrolled_courses(page)
            await browser.close()

            log_progress(90, f"Discovered {len(discovered)} registered courses. Saving to settings...")
            settings = load_settings()
            settings["discovered_courses"] = discovered
            
            # If no selected courses exist, select all by default
            if not settings.get("selected_courses"):
                settings["selected_courses"] = [c["code"] for c in discovered]
            
            save_settings(settings)
            log_progress(100, f"Discovery complete! Found {len(discovered)} active courses.")
            
            return {
                "success": True,
                "count": len(discovered),
                "courses": discovered,
                "selected_courses": settings.get("selected_courses", [])
            }

    async def run(self) -> Dict:
        os.makedirs(DATA_DIR, exist_ok=True)
        start_time = datetime.datetime.now()

        log_progress(5, "Launching headless browser session...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                ignore_https_errors=True
            )
            page = await context.new_page()

            # 1. Login
            log_progress(10, "Connecting to OUSL IAM Keycloak server...")
            logged_in = await self._login(page)
            if not logged_in:
                log_progress(100, "Authentication failed. Check your student credentials.")
                await browser.close()
                return {"error": "Authentication failed", "success": False}

            log_progress(20, "Authentication successful. Discovering target courses...")
            # 2. Extract Courses (filtered by target_courses)
            courses_list = await self._scrape_courses(page)
            for c in courses_list:
                self.course_map[c['code']] = c['title'].replace(c['code'], '').strip()
                self.course_url_map[c['code']] = c['url']

            target_count = len(courses_list)
            log_progress(35, f"Filtered to {target_count} active target courses. Extracting direct notification links...")

            # 3. Extract Portal Notifications with exact discussion / assignment links
            notifications = await self._scrape_notifications(page)
            log_progress(50, f"Extracted {len(notifications)} portal notifications with direct links. Starting course forums...")

            # 4. Extract Announcements / Forum posts per course
            structured_courses = []
            all_course_updates = []

            total_courses = len(courses_list)
            for i, course in enumerate(courses_list):
                current_percent = 50 + int((i / max(total_courses, 1)) * 45)
                log_progress(current_percent, f"Scanning [{i+1}/{total_courses}] {course['code']} — {course['title'][:30]}...")
                sections = await self._scrape_course_content(page, course)
                updates = await self._scrape_course_forums(page, course)
                all_course_updates.extend(updates)
                resources_count = sum(count_course_resources(section.get("resources", [])) for section in sections)
                structured_courses.append({
                    "id": course['url'].split("id=")[-1] if "id=" in course['url'] else course['title'],
                    "code": course['code'],
                    "title": course['title'],
                    "url": course['url'],
                    "updates_count": len(updates),
                    "updates": updates,
                    "sections_count": len(sections),
                    "resources_count": resources_count,
                    "sections": sections
                })

            await browser.close()

            log_progress(95, "Finalizing and saving academic digest...")
            # Save seen state
            if self.state_manager:
                self.state_manager.save()

            end_time = datetime.datetime.now()
            duration_sec = round((end_time - start_time).total_seconds(), 1)

            payload = {
                "success": True,
                "synced_at": end_time.isoformat(),
                "duration_seconds": duration_sec,
                "stats": {
                    "total_notifications": len(notifications),
                    "total_courses": len(structured_courses),
                    "total_updates": len(all_course_updates),
                    "total_sections": sum(len(course.get("sections", [])) for course in structured_courses),
                    "total_resources": sum(course.get("resources_count", 0) for course in structured_courses)
                },
                "notifications": notifications,
                "courses": structured_courses
            }

            # Save to lms_data.json
            with open(LMS_DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)

            # Update last_sync_timestamp in settings.json
            settings = load_settings()
            settings["last_sync_timestamp"] = end_time.isoformat()
            save_settings(settings)

            log_progress(100, f"Sync complete in {duration_sec}s! {len(notifications)} alerts & {len(all_course_updates)} updates loaded.")
            return payload

    async def _login(self, page) -> bool:
        try:
            await page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=45000)
            
            iam_btn = await page.query_selector('a:has-text("IAM OUSL LMS USER"), a[href*="oauth2"]')
            if iam_btn:
                await iam_btn.click()
                await page.wait_for_load_state("domcontentloaded", timeout=45000)

            username_input = await page.wait_for_selector('input[name="username"], input#username', timeout=15000)
            password_input = await page.wait_for_selector('input[name="password"], input#password', timeout=15000)

            if not username_input or not password_input:
                return False

            await username_input.fill(self.username)
            await password_input.fill(self.password)

            submit_btn = await page.query_selector('input[type="submit"], button[type="submit"], input#kc-login')
            if submit_btn:
                await submit_btn.click()
            else:
                await page.keyboard.press("Enter")

            await page.wait_for_load_state("domcontentloaded", timeout=45000)
            await page.wait_for_timeout(1500)

            if "login/index.php" in page.url and not "loginredirect" in page.url:
                return False

            return True

        except Exception as e:
            print(f"[!] Error during login: {e}")
            return False

    async def _scrape_all_enrolled_courses(self, page) -> List[Dict]:
        """Scrapes all enrolled courses without filtering."""
        courses = []
        try:
            await page.goto(COURSES_URL, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(1500)
            
            course_elements = await page.eval_on_selector_all(
                '.dashboard-card, .course-info-container, a[href*="/course/view.php?id="]',
                '''elements => elements.map(e => {
                    const link = e.querySelector('a')?.href || e.href || '';
                    const title = e.innerText.trim();
                    return { title, link };
                })'''
            )

            seen_urls = set()
            seen_codes = set()
            for c in course_elements:
                link = c.get('link', '')
                title = c.get('title', '')
                if not link or "/course/view.php?id=" not in link or link in seen_urls:
                    continue
                
                first_line = title.split('\n')[0].strip()
                first_line = re.sub(r'^(Course image|Course name|Card)\s*', '', first_line).strip()

                code_match = re.search(r'([A-Z]{3,4}\d{4}|BSE|[A-Z]{2,6}\d{0,4})', first_line)
                code = code_match.group(1) if code_match else first_line[:8].strip()

                if code in seen_codes:
                    continue

                seen_codes.add(code)
                seen_urls.add(link)

                clean_title = COURSE_NAMES_DICT.get(code) or first_line
                if not clean_title.startswith(code):
                    clean_title = f"{code} {clean_title}"

                courses.append({
                    "code": code,
                    "title": clean_title,
                    "url": link
                })

        except Exception as e:
            print(f"[!] Error discovering courses: {e}")

        return courses

    async def _scrape_courses(self, page) -> List[Dict]:
        all_courses = await self._scrape_all_enrolled_courses(page)
        if not self.target_courses:
            return all_courses
        
        filtered = []
        for c in all_courses:
            code = c.get('code', '')
            if any(t.lower() == code.lower() or t.lower() in c.get('title', '').lower() for t in self.target_courses):
                filtered.append(c)
        return filtered

    async def _scrape_course_content(self, page, course: Dict) -> List[Dict]:
        """Capture the complete visible Moodle section/activity hierarchy for a course."""
        sections = []
        try:
            await page.goto(course['url'], wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(900)

            raw_sections = await page.evaluate('''() => {
                const selector = 'li.section, .course-section, [data-sectionid]';
                const candidates = Array.from(new Set(document.querySelectorAll(selector)));
                const sectionNodes = candidates.filter((node) =>
                    !candidates.some((other) => other !== node && other.contains(node))
                );

                const cleanText = (node) => {
                    if (!node) return '';
                    let text = (node.innerText || node.textContent || '');
                    for (const hidden of node.querySelectorAll('.accesshide, .sr-only')) {
                        const hiddenText = (hidden.innerText || hidden.textContent || '').trim();
                        if (hiddenText) text = text.replace(hiddenText, '');
                    }
                    return text.replace(/\\s+/g, ' ').trim();
                };

                const validHref = (anchor) => {
                    if (!anchor || !anchor.href) return false;
                    const href = anchor.href;
                    return !href.startsWith('javascript:') &&
                        !href.includes('#') &&
                        !href.includes('/course/view.php') &&
                        !href.includes('/user/') &&
                        !href.includes('/login/') &&
                        !href.includes('/course/modedit.php');
                };

                return sectionNodes.map((section, sectionIndex) => {
                    const titleNode = section.querySelector(
                        'h3.sectionname, .sectionname, [data-for="section_title"] h3, .course-section-header h3, h2.sectionname'
                    );
                    const summaryNode = section.querySelector(
                        '.summary, .section-summary, .description .no-overflow, .content .summarytext'
                    );
                    const activityCandidates = Array.from(new Set(section.querySelectorAll(
                        'li.activity, .activity-item, [data-activityname], .mod-indent-outer'
                    )));
                    const activityNodes = activityCandidates.filter((node) =>
                        !activityCandidates.some((other) => other !== node && other.contains(node))
                    );

                    let resources = [];
                    let currentSubsection = '';
                    for (const activity of activityNodes) {
                        const isLabel = activity.classList.contains('modtype_label') || activity.classList.contains('label');
                        const titleEl = activity.querySelector(
                            '.activityname .instancename, .activity-instance .instancename, [data-region="activity-title"], .activityname, h4'
                        );
                        const mainLink = isLabel ? null : activity.querySelector(
                            '.activityinstance a.aalink, .activityname a, a[href*="/mod/"], a[href*="pluginfile.php"], a[href]'
                        );
                        const descriptionEl = activity.querySelector(
                            '.activity-description, .contentafterlink, .description .no-overflow, .description'
                        );
                        const availabilityEl = activity.querySelector('.availabilityinfo, [data-region="availabilityinfo"]');
                        const icon = activity.querySelector('img.activityicon, .activityiconcontainer img, img.icon');
                        const activityText = cleanText(activity);
                        const title = cleanText(titleEl) || cleanText(mainLink) || activityText.split(' ').slice(0, 18).join(' ');
                        const url = validHref(mainLink) ? mainLink.href : '';
                        if (isLabel && activityText.length <= 90) {
                            currentSubsection = activityText;
                        }

                        if (title || url) {
                            resources.push({
                                title,
                                url,
                                description: cleanText(descriptionEl) || (isLabel ? activityText : ''),
                                availability: cleanText(availabilityEl),
                                iconAlt: icon?.alt || '',
                                hint: `${activity.className || ''} ${activity.dataset?.activityname || ''}`,
                                subsection: currentSubsection,
                            });
                        }

                        for (const anchor of activity.querySelectorAll('a[href]')) {
                            if (!validHref(anchor) || anchor.href === url) continue;
                            const extraTitle = cleanText(anchor);
                            if (!extraTitle) continue;
                            resources.push({
                                title: extraTitle,
                                url: anchor.href,
                                description: '',
                                availability: '',
                                iconAlt: '',
                                hint: 'embedded-link',
                                subsection: currentSubsection,
                            });
                        }
                    }

                    if (activityNodes.length === 0) {
                        resources = Array.from(section.querySelectorAll('a[href]'))
                            .filter(validHref)
                            .map((anchor) => ({
                                title: cleanText(anchor),
                                url: anchor.href,
                                description: '',
                                availability: '',
                                iconAlt: '',
                                hint: 'section-link',
                                subsection: '',
                            }))
                            .filter((item) => item.title);
                    }

                    return {
                        id: section.dataset?.sectionid || section.id || `section-${sectionIndex + 1}`,
                        title: cleanText(titleNode) || `Course Section ${sectionIndex + 1}`,
                        summary: cleanText(summaryNode),
                        index: sectionIndex,
                        resources,
                    };
                });
            }''')

            visited_resource_urls = set()
            remaining_resource_visits = [1000]
            for section_index, raw_section in enumerate(raw_sections):
                section_title = (raw_section.get("title") or f"Course Section {section_index + 1}").strip()
                section_summary = (raw_section.get("summary") or "").strip()
                section_category = classify_course_section(f"{section_title} {section_summary}")
                section_group = get_exam_study_group(f"{section_title} {section_summary}", section_category)
                resources = []
                seen_resources = set()

                for resource_index, raw_resource in enumerate(raw_section.get("resources", [])):
                    title = re.sub(r'\s+', ' ', (raw_resource.get("title") or "")).strip()
                    url = (raw_resource.get("url") or "").strip()
                    description = re.sub(r'\s+', ' ', (raw_resource.get("description") or "")).strip()
                    availability = re.sub(r'\s+', ' ', (raw_resource.get("availability") or "")).strip()
                    hint = raw_resource.get("hint") or ""
                    icon_alt = raw_resource.get("iconAlt") or ""
                    subsection = re.sub(r'\s+', ' ', (raw_resource.get("subsection") or "")).strip()
                    if not title and not url:
                        continue

                    dedupe_key = url or f"{section_title}:{title}"
                    if dedupe_key in seen_resources:
                        continue
                    seen_resources.add(dedupe_key)

                    combined_text = f"{section_title} {subsection} {title} {description}"
                    resource_category = classify_course_section(combined_text)
                    effective_category = resource_category if resource_category != "general" else section_category
                    study_group = get_exam_study_group(combined_text, effective_category)
                    kind = classify_course_resource(url, title, f"{hint} {icon_alt}")
                    extension_match = re.search(r'\.([A-Za-z0-9]{2,5})(?:\?|$)', url)
                    is_exam_relevant = is_exam_relevant_resource(combined_text, kind, study_group)
                    if kind == "label" and subsection and subsection.lower() == title.lower() and description.lower() == title.lower():
                        is_exam_relevant = False

                    resources.append({
                        "id": f"{raw_section.get('id') or f'section-{section_index + 1}'}-resource-{resource_index + 1}",
                        "title": title or "Course resource",
                        "url": url,
                        "kind": kind,
                        "description": description,
                        "file_type": extension_match.group(1).lower() if extension_match else "",
                        "availability": availability,
                        "icon_alt": icon_alt,
                        "section_title": section_title,
                        "subsection": subsection,
                        "study_group": study_group,
                        "is_exam_relevant": is_exam_relevant,
                        "children": [],
                    })

                for resource in resources:
                    await self._enrich_course_resource(
                        page,
                        resource,
                        visited_urls=visited_resource_urls,
                        remaining_visits=remaining_resource_visits,
                    )

                sections.append({
                    "id": raw_section.get("id") or f"section-{section_index + 1}",
                    "title": section_title,
                    "summary": section_summary,
                    "index": raw_section.get("index", section_index),
                    "category": section_category,
                    "study_group": section_group,
                    "resources_count": count_course_resources(resources),
                    "resources": resources,
                })

        except Exception as e:
            print(f"[!] Error indexing course content for {course.get('code', course.get('title', 'course'))}: {e}")

        return sections

    async def _enrich_course_resource(
        self,
        page,
        resource: Dict,
        visited_urls: set,
        remaining_visits: List[int],
    ) -> None:
        """Visit Moodle container activities and attach nested files, chapters, and links."""
        url = (resource.get("url") or "").strip()
        navigation_url = urldefrag(url).url
        kind = resource.get("kind") or "other"
        if (
            not navigation_url
            or navigation_url in visited_urls
            or remaining_visits[0] <= 0
            or urlparse(navigation_url).hostname != "oulms.ou.ac.lk"
            or kind not in {"folder", "book", "page", "lesson", "assignment", "quiz", "forum", "other"}
        ):
            return

        visited_urls.add(navigation_url)
        remaining_visits[0] -= 1
        try:
            await page.goto(navigation_url, wait_until="domcontentloaded", timeout=25000)
            await page.wait_for_timeout(350)
            details = await page.evaluate('''() => {
                const cleanText = (node) => (node?.innerText || node?.textContent || '')
                    .replace(/\\s+/g, ' ')
                    .trim();
                const main = document.querySelector('#region-main, [role="main"], main');
                if (!main) return { summary: '', children: [] };

                const contentSelectors = [
                    '.foldertree', '.book_content', '.book_toc', '.no-overflow',
                    '.activity-description', '.assignintro', '.quizinfo',
                    '.resourceworkaround', '.lesson-content', '.forum-post-container'
                ];
                const contentNodes = contentSelectors.flatMap((selector) =>
                    Array.from(main.querySelectorAll(selector))
                );
                const summaryNode = contentNodes.find((node) => cleanText(node).length > 0);
                const summary = cleanText(summaryNode).slice(0, 1800);
                const currentUrl = new URL(location.href);
                const isBookChapter = location.pathname.includes('/mod/book/') && currentUrl.searchParams.has('chapterid');

                const anchors = Array.from(new Set([
                    ...main.querySelectorAll('a[href]'),
                    ...(isBookChapter ? [] : document.querySelectorAll('.book_toc a[href]'))
                ]));
                const children = anchors.filter((anchor) => {
                    const href = anchor.href || '';
                    if (!href || href.startsWith('javascript:') || href.split('#')[0] === location.href.split('#')[0]) return false;
                    if (anchor.closest('nav, .breadcrumb, .activity-navigation, .secondary-navigation, .dropdown-menu, [data-region="drawer"]')) return false;
                    if (isBookChapter && anchor.closest('.book_toc')) return false;
                    if (/\\/(login|user|calendar|message|grade|admin)\\//.test(href)) return false;
                    const inContent = contentSelectors.some((selector) => anchor.closest(selector));
                    return href.includes('pluginfile.php') ||
                        href.includes('/mod/forum/discuss.php') ||
                        href.includes('/mod/book/view.php') ||
                        (inContent && !href.includes('/course/view.php'));
                }).map((anchor) => ({
                    title: cleanText(anchor) || anchor.getAttribute('download') || 'Nested course resource',
                    url: anchor.href,
                    hint: `${anchor.className || ''} nested-resource`,
                }));

                return { summary, children };
            }''')

            detail_summary = re.sub(r'\s+', ' ', (details.get("summary") or "")).strip()
            if detail_summary and not resource.get("description"):
                resource["description"] = detail_summary

            nested_resources = []
            seen_urls = set()
            for child_index, child in enumerate(details.get("children", [])):
                child_url = (child.get("url") or "").strip()
                normalized_child_url = urldefrag(child_url).url
                child_title = re.sub(r'\s+', ' ', (child.get("title") or "Nested course resource")).strip()
                if not normalized_child_url or normalized_child_url in seen_urls or normalized_child_url == navigation_url:
                    continue
                seen_urls.add(normalized_child_url)

                section_title = resource.get("section_title") or ""
                subsection = resource.get("subsection") or ""
                combined_text = f"{section_title} {subsection} {resource.get('title', '')} {child_title}"
                child_category = classify_course_section(combined_text)
                child_group = (
                    get_exam_study_group(combined_text, child_category)
                    if child_category != "general"
                    else resource.get("study_group", "Course Foundations")
                )
                child_kind = classify_course_resource(normalized_child_url, child_title, child.get("hint") or "")
                extension_match = re.search(r'\.([A-Za-z0-9]{2,5})(?:\?|$)', normalized_child_url)
                child_resource = {
                    "id": f"{resource.get('id', 'resource')}-child-{child_index + 1}",
                    "title": child_title,
                    "url": normalized_child_url,
                    "kind": child_kind,
                    "description": "",
                    "file_type": extension_match.group(1).lower() if extension_match else "",
                    "availability": "",
                    "icon_alt": "",
                    "section_title": section_title,
                    "subsection": subsection,
                    "study_group": child_group,
                    "is_exam_relevant": is_exam_relevant_resource(combined_text, child_kind, child_group),
                    "children": [],
                }
                await self._enrich_course_resource(
                    page,
                    child_resource,
                    visited_urls=visited_urls,
                    remaining_visits=remaining_visits,
                )
                nested_resources.append(child_resource)

            resource["children"] = nested_resources
        except Exception as e:
            print(f"[!] Could not inspect nested resource {resource.get('title', url)}: {e}")

    async def _scrape_notifications(self, page) -> List[Dict]:
        notifications = []
        try:
            await page.goto(NOTIFICATIONS_URL, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(1500)
            
            items = await page.query_selector_all('.content-item-container')

            for idx, item in enumerate(items):
                try:
                    await item.click()
                    await page.wait_for_timeout(250)

                    details = await page.evaluate('''() => {
                        const rightPane = document.querySelector(".notification-area") || document.querySelector(".popover-region-container") || document.body;
                        const anchors = Array.from(rightPane.querySelectorAll("a"));
                        
                        let targetLink = "";
                        for (const a of anchors) {
                            if (a.innerText.includes("Go to:") || a.innerText.includes("See this post") || a.href.includes("discuss.php")) {
                                targetLink = a.href;
                                break;
                            }
                        }
                        if (!targetLink) {
                            for (const a of anchors) {
                                if (a.href.includes("/mod/") || a.href.includes("pluginfile.php")) {
                                    targetLink = a.href;
                                    break;
                                }
                            }
                        }

                        const msgEl = rightPane.querySelector(".notification-message, .content, .notification-text") || rightPane;
                        const content = msgEl ? msgEl.innerText.trim() : "";
                        const contentHtml = msgEl ? msgEl.innerHTML : "";

                        const extractedLinks = anchors
                            .filter(a => a.href && !a.href.startsWith("javascript") && !a.href.includes("#"))
                            .map(a => ({ title: a.innerText.trim() || a.href, url: a.href }));

                        return {
                            targetLink,
                            content,
                            contentHtml,
                            extractedLinks
                        };
                    }''')

                    direct_target_link = details.get('targetLink', '')
                    content_text = details.get('content', '')
                    content_html = details.get('contentHtml', '')
                    raw_extracted_links = details.get('extractedLinks', [])

                    raw_text = await item.inner_text()
                    if not raw_text or "Select from the list" in raw_text:
                        continue

                    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
                    raw_title = lines[0] if lines else raw_text
                    
                    time_str = ""
                    for l in lines[1:]:
                        if re.search(r'(\d+\s*(?:hour|min|sec|day|week|month)s?\s*ago|yesterday|today|\d{1,2}\s+[A-Za-z]{3,9})', l, re.IGNORECASE):
                            time_str = l.strip()
                            break
                    if not time_str and len(lines) > 1:
                        time_str = lines[1]

                    category = categorize_notification(raw_title)

                    code, course_name = extract_course_code_and_name(raw_title, self.course_map, self.target_courses)
                    if not code:
                        code = "PORTAL"
                        course_name = "OUSL Portal Notice"
                    elif not course_name:
                        course_name = self.course_map.get(code) or COURSE_NAMES_DICT.get(code, f"Course {code}")

                    clean_title = clean_title_text(raw_title, code, self.course_map)

                    final_link = direct_target_link.strip() if direct_target_link else ""
                    if not final_link:
                        if code and code in self.course_url_map:
                            final_link = self.course_url_map[code]
                        else:
                            final_link = NOTIFICATIONS_URL
                    
                    attachments = []
                    links_list = []
                    for lk in raw_extracted_links:
                        u = lk.get('url', '')
                        t = lk.get('title', '')
                        if not u or u == final_link or u.endswith('discuss.php') or u.endswith('view.php'):
                            continue
                        att_type = classify_attachment_type(u)
                        if att_type != 'other' or 'pluginfile.php' in u:
                            attachments.append({
                                "name": t if t and t != u else os.path.basename(u.split('?')[0]) or "Attachment",
                                "url": u,
                                "type": att_type
                            })
                        else:
                            link_type = classify_link_type(u)
                            links_list.append({
                                "title": t or u,
                                "url": u,
                                "type": link_type
                            })

                    is_new = self.state_manager.is_new("notification", clean_title, final_link, time_str)
                    if self.filter_seen and not is_new:
                        continue

                    self.state_manager.mark_seen("notification", clean_title, final_link, time_str)
                    notifications.append({
                        "id": f"notif-{len(notifications)+1}",
                        "title": clean_title,
                        "category": category,
                        "course_code": code,
                        "course_name": course_name,
                        "time": time_str,
                        "link": final_link,
                        "is_new": is_new,
                        "content": content_text or clean_title,
                        "content_html": content_html,
                        "attachments": attachments,
                        "links": links_list
                    })
                except Exception as ne:
                    print(f"    [!] Error reading notification item: {ne}")

        except Exception as e:
            print(f"[!] Error fetching notifications: {e}")

        return notifications

    async def _scrape_course_forums(self, page, course: Dict) -> List[Dict]:
        course_name = course['title']
        course_url = course['url']
        updates = []

        try:
            await page.goto(course_url, wait_until="domcontentloaded", timeout=25000)
            await page.wait_for_timeout(800)

            forum_links = await page.eval_on_selector_all(
                'a[href*="/mod/forum/view.php?id="]',
                'elements => elements.map(e => ({ title: e.innerText.trim(), href: e.href }))'
            )

            for forum in forum_links:
                forum_title = forum['title'].replace('\n', ' ')
                forum_url = forum['href']

                if any(bad in forum_title.lower() for bad in ["introduce yourself", "icebreaker", "say hello"]):
                    continue

                try:
                    await page.goto(forum_url, wait_until="domcontentloaded", timeout=20000)
                    await page.wait_for_timeout(600)

                    discussions = await page.eval_on_selector_all(
                        'tr.discussion, .discussion-list tr',
                        '''elements => elements.map(e => {
                            const titleEl = e.querySelector('.topic a, .discussionname a, th a');
                            const authorEl = e.querySelector('.author, .userpicture + a, .author-info');
                            const timeEl = e.querySelector('.lastpost a, .replies, .created, time');
                            return {
                                topic: titleEl ? titleEl.innerText.trim() : '',
                                link: titleEl ? titleEl.href : '',
                                author: authorEl ? authorEl.innerText.trim() : '',
                                time: timeEl ? timeEl.innerText.trim() : ''
                            };
                        })'''
                    )

                    for idx, d in enumerate(discussions):
                        raw_topic = d.get('topic', '').strip()
                        link = d.get('link', '')
                        author = d.get('author', '').strip().replace('\n', ' ')
                        time_str = d.get('time', '').strip().replace('\n', ' ')

                        if not raw_topic or not link or raw_topic.lower() == "discussion":
                            continue

                        clean_topic = clean_title_text(raw_topic, course['code'], self.course_map)
                        category = categorize_notification(clean_topic)
                        is_new = self.state_manager.is_new("forum_post", clean_topic, link, time_str)
                        if self.filter_seen and not is_new:
                            continue

                        content_text = ""
                        attachments = []
                        links_list = []

                        # For recent discussions, inspect post body to extract real embedded links & attachments
                        if idx < 6 and link:
                            try:
                                post_page = await page.context.new_page()
                                await post_page.goto(link, wait_until="domcontentloaded", timeout=14000)
                                await post_page.wait_for_timeout(350)
                                post_res = await post_page.evaluate('''() => {
                                    const postEl = document.querySelector(".forumpost .content, .post-content-container, .posting") || document.querySelector(".forumpost");
                                    if (!postEl) return { content: "", links: [] };
                                    const content = postEl.innerText.trim();
                                    const anchors = Array.from(postEl.querySelectorAll("a"));
                                    const extracted = [];
                                    for (const a of anchors) {
                                        const href = a.href;
                                        const title = a.innerText.trim();
                                        if (!href || href.startsWith("javascript") || href.includes("#") || href.includes("discuss.php?d=") || href.includes("post.php?reply=")) {
                                            continue;
                                        }
                                        if (!href.includes("/user/") && !href.includes("/mod/forum/view.php")) {
                                            extracted.push({ title: title || href, url: href });
                                        }
                                    }
                                    return { content, links: extracted };
                                }''')

                                raw_content = post_res.get('content', '')
                                content_text = raw_content
                                found_links = post_res.get('links', [])

                                # Also check for plaintext URLs inside the post text
                                text_urls = re.findall(r'https?://[^\s<>\"\'\)]+', raw_content)
                                for tu in text_urls:
                                    if not any(fl['url'] == tu for fl in found_links):
                                        found_links.append({"title": tu, "url": tu})

                                for lk in found_links:
                                    u = lk.get('url', '')
                                    t = lk.get('title', '')
                                    if not u or u == link or u.endswith('discuss.php'):
                                        continue

                                    # If this link points to a Moodle Page/Resource (e.g. mod/page/view.php?id=149349)
                                    if '/mod/page/view.php' in u or '/mod/resource/view.php' in u or '/mod/url/view.php' in u:
                                        try:
                                            inner_page = await page.context.new_page()
                                            await inner_page.goto(u, wait_until="domcontentloaded", timeout=12000)
                                            await inner_page.wait_for_timeout(350)
                                            inner_data = await inner_page.evaluate('''() => {
                                                const mainEl = document.querySelector("#region-main, .box.generalbox, .page-content, .generalbox") || document.body;
                                                const text = mainEl.innerText.trim();
                                                const anchors = Array.from(mainEl.querySelectorAll("a"));
                                                const extracted = [];
                                                for (const a of anchors) {
                                                    const href = a.href;
                                                    const title = a.innerText.trim();
                                                    if (href && !href.startsWith("javascript") && !href.includes("#") && !href.includes("/user/")) {
                                                        extracted.push({ title: title || href, url: href });
                                                    }
                                                }
                                                return { text, links: extracted };
                                            }''')
                                            await inner_page.close()

                                            inner_text = inner_data.get('text', '')
                                            if inner_text and inner_text not in content_text:
                                                content_text += f"\n\n[Linked Section Details]:\n{inner_text}"

                                            for ilk in inner_data.get('links', []):
                                                iu = ilk.get('url', '')
                                                it = ilk.get('title', '')
                                                if not iu or iu == u or iu == link:
                                                    continue
                                                i_att_type = classify_attachment_type(iu)
                                                if i_att_type != 'other' or 'pluginfile.php' in iu:
                                                    attachments.append({
                                                        "name": it if it and it != iu else os.path.basename(iu.split('?')[0]) or "Attachment",
                                                        "url": iu,
                                                        "type": i_att_type
                                                    })
                                                else:
                                                    links_list.append({
                                                        "title": it if it and it != iu else "Click Here to Obtain Eligibility Status",
                                                        "url": iu,
                                                        "type": classify_link_type(iu)
                                                    })
                                        except Exception:
                                            pass

                                    att_t = classify_attachment_type(u)
                                    if att_t != 'other' or 'pluginfile.php' in u:
                                        attachments.append({
                                            "name": t if t and t != u else os.path.basename(u.split('?')[0]) or "Attachment",
                                            "url": u,
                                            "type": att_t
                                        })
                                    else:
                                        link_title = t if t and t != u else ("Eligibility Status Section" if "eligib" in u.lower() or "eligib" in clean_topic.lower() else "Open Resource")
                                        links_list.append({
                                            "title": link_title,
                                            "url": u,
                                            "type": classify_link_type(u)
                                        })

                                await post_page.close()
                            except Exception:
                                pass

                        self.state_manager.mark_seen("forum_post", clean_topic, link, time_str)
                        updates.append({
                            "id": f"upd-{len(updates)+1}",
                            "course_code": course['code'],
                            "course_name": course_name,
                            "forum_name": forum_title,
                            "topic": clean_topic,
                            "author": author,
                            "time": time_str,
                            "category": category,
                            "link": link,
                            "is_new": is_new,
                            "content": content_text or clean_topic,
                            "content_html": "",
                            "attachments": attachments,
                            "links": links_list
                        })
                except Exception as fe:
                    print(f"    [!] Error reading forum {forum_title}: {fe}")

        except Exception as e:
            print(f"[!] Error reading course {course_name}: {e}")

        return updates

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    parser = argparse.ArgumentParser(description="OUSL LMS Crawler")
    parser.add_argument("--discover", action="store_true", help="Discover all enrolled courses without full crawl")
    parser.add_argument("--courses", type=str, help="Comma-separated list of course codes to target")
    parser.add_argument("--username", type=str, help="OUSL Username / Student ID")
    parser.add_argument("--password", type=str, help="OUSL Password")
    args = parser.parse_args()

    settings = load_settings()
    user = args.username or os.getenv("OUSL_USERNAME") or settings.get("ousl_username")
    pwd = args.password or os.getenv("OUSL_PASSWORD") or settings.get("ousl_password")
    
    target_courses_arg = None
    if args.courses:
        target_courses_arg = [c.strip() for c in args.courses.split(",") if c.strip()]

    if not user or not pwd:
        print("[!] Error: OUSL credentials must be provided via CLI, environment variables, or settings.json")
        sys.exit(1)

    crawler = OUSLCrawler(
        username=user,
        password=pwd,
        target_courses=target_courses_arg
    )
    
    if args.discover:
        result = asyncio.run(crawler.discover_courses())
        print(json.dumps(result, indent=2))
        if not result.get("success"):
            sys.exit(1)
    else:
        result = asyncio.run(crawler.run())
        if not result.get("success"):
            print(json.dumps(result, indent=2), file=sys.stderr)
            sys.exit(1)
