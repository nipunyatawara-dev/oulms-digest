import asyncio
import datetime
import json
import os
import re
import sys
import argparse
from typing import Dict, List, Tuple, Optional
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
                updates = await self._scrape_course_forums(page, course)
                all_course_updates.extend(updates)
                structured_courses.append({
                    "id": course['url'].split("id=")[-1] if "id=" in course['url'] else course['title'],
                    "code": course['code'],
                    "title": course['title'],
                    "url": course['url'],
                    "updates_count": len(updates),
                    "updates": updates
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
                    "total_updates": len(all_course_updates)
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
                except Exception as ie:
                    print(f"[!] Error processing notification item {idx}: {ie}")

        except Exception as e:
            print(f"[!] Error scraping notifications: {e}")

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

                    for d in discussions:
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
                            "content": clean_topic,
                            "content_html": "",
                            "attachments": [],
                            "links": []
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
    else:
        asyncio.run(crawler.run())

