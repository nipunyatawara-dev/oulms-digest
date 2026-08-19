import asyncio
import datetime
import json
import os
import re
import sys
from typing import Dict, List, Tuple
from playwright.async_api import async_playwright
from state_manager import StateManager

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
LMS_DATA_FILE = os.path.join(DATA_DIR, "lms_data.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")

LOGIN_URL = "https://oulms.ou.ac.lk/login/index.php"
COURSES_URL = "https://oulms.ou.ac.lk/my/courses.php"
NOTIFICATIONS_URL = "https://oulms.ou.ac.lk/message/output/popup/notifications.php"

# TARGET COURSES WHITELIST
TARGET_COURSE_CODES = [
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

def clean_title_text(title: str, course_code: str = "") -> str:
    cleaned = title.strip()
    cleaned = re.sub(r'^[A-Z]{3,4}\d{4}[A-Za-z0-9_]*:\s*', '', cleaned)
    cleaned = re.sub(r'^[A-Z]{3,4}\d{4}\s+[^:]+:\s*', '', cleaned)
    for code, name in COURSE_NAMES_DICT.items():
        if cleaned.startswith(f"{code} {name}"):
            cleaned = cleaned[len(f"{code} {name}"):].strip()
        elif cleaned.startswith(f"{code}:"):
            cleaned = cleaned[len(f"{code}:"):].strip()
        elif cleaned.startswith(code):
            cleaned = cleaned[len(code):].strip()
    
    cleaned = re.sub(r'^[_\-:\s]+', '', cleaned).strip()
    return cleaned if cleaned else title

def categorize_notification(text: str) -> str:
    lower = text.lower()
    if any(k in lower for k in ["mark", "result", "grade", "cat", "oq", "tma", "ocam"]):
        return "Grades & Marks"
    if any(k in lower for k in ["viva", "exam", "final", "resit", "opportunity", "schedule"]):
        return "Viva & Exam"
    if any(k in lower for k in ["due", "assignment", "quiz", "deadline", "submission"]):
        return "Deadlines & Quizzes"
    return "Announcements"

def extract_course_code_and_name(text: str, course_map: Dict[str, str]) -> Tuple[str, str]:
    for target in TARGET_COURSE_CODES:
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
    def __init__(self, username: str, password: str, state_manager: StateManager = None, filter_seen: bool = False):
        self.username = username
        self.password = password
        self.state_manager = state_manager or StateManager(os.path.join(DATA_DIR, "seen_items.json"))
        self.filter_seen = filter_seen
        self.course_map: Dict[str, str] = {}
        self.course_url_map: Dict[str, str] = {}

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
            # 2. Extract Courses
            courses_list = await self._scrape_courses(page)
            for c in courses_list:
                self.course_map[c['code']] = c['title'].replace(c['code'], '').strip()
                self.course_url_map[c['code']] = c['url']

            log_progress(35, f"Filtered to {len(courses_list)} active target courses. Extracting direct notification links...")

            # 3. Extract Portal Notifications with exact discussion / assignment links
            notifications = await self._scrape_notifications(page)
            log_progress(50, f"Extracted {len(notifications)} portal notifications with direct links. Starting course forums...")

            # 4. Extract Announcements / Forum posts per course
            structured_courses = []
            all_course_updates = []

            total_courses = len(courses_list)
            for i, course in enumerate(courses_list):
                current_percent = 50 + int((i / total_courses) * 45)
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
            if os.path.exists(SETTINGS_FILE):
                try:
                    with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                        settings = json.load(f)
                    settings["last_sync_timestamp"] = end_time.isoformat()
                    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
                        json.dump(settings, f, indent=2)
                except Exception as e:
                    print(f"[!] Warning: Could not update settings last_sync: {e}")

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

    async def _scrape_notifications(self, page) -> List[Dict]:
        notifications = []
        try:
            await page.goto(NOTIFICATIONS_URL, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(1500)
            
            items = await page.query_selector_all('.content-item-container')

            for idx, item in enumerate(items):
                try:
                    # Click item to reveal exact context link in the right pane
                    await item.click()
                    await page.wait_for_timeout(250)

                    direct_target_link = await page.evaluate('''() => {
                        const rightPane = document.querySelector(".notification-area") || document.body;
                        const anchors = Array.from(rightPane.querySelectorAll("a"));
                        
                        // Priority 1: Direct discussion topic or "Go to" link
                        for (const a of anchors) {
                            if (a.innerText.includes("Go to:") || a.innerText.includes("See this post") || a.href.includes("discuss.php")) {
                                return a.href;
                            }
                        }
                        // Priority 2: Direct mod assignment, quiz, or plugin file link
                        for (const a of anchors) {
                            if (a.href.includes("/mod/") || a.href.includes("pluginfile.php")) {
                                return a.href;
                            }
                        }
                        return "";
                    }''')

                    raw_text = await item.inner_text()
                    if not raw_text or "Select from the list" in raw_text:
                        continue

                    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
                    raw_title = lines[0] if lines else raw_text
                    time_str = lines[1] if len(lines) > 1 and ("ago" in lines[1] or "day" in lines[1] or "min" in lines[1] or "hour" in lines[1]) else ""
                    category = categorize_notification(raw_title)

                    code, course_name = extract_course_code_and_name(raw_title, self.course_map)
                    
                    # Filter only relevant courses
                    if code and code not in TARGET_COURSE_CODES and not any(t in code for t in TARGET_COURSE_CODES):
                        continue

                    clean_title = clean_title_text(raw_title, code)

                    # Ensure direct link is used
                    final_link = direct_target_link.strip() if direct_target_link else ""
                    if not final_link:
                        if code and code in self.course_url_map:
                            final_link = self.course_url_map[code]
                        else:
                            final_link = NOTIFICATIONS_URL

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
                        "is_new": is_new
                    })
                except Exception as ie:
                    print(f"[!] Error processing notification item {idx}: {ie}")

        except Exception as e:
            print(f"[!] Error scraping notifications: {e}")

        return notifications

    async def _scrape_courses(self, page) -> List[Dict]:
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

                matched_target = None
                for target in TARGET_COURSE_CODES:
                    if target.lower() in first_line.lower() or target.lower() in link.lower():
                        matched_target = target
                        break

                if not matched_target:
                    continue

                if matched_target in seen_codes:
                    continue

                seen_codes.add(matched_target)
                seen_urls.add(link)
                clean_course_title = f"{matched_target} {COURSE_NAMES_DICT.get(matched_target, first_line)}"

                courses.append({
                    "code": matched_target,
                    "title": clean_course_title,
                    "url": link
                })

        except Exception as e:
            print(f"[!] Error discovering courses: {e}")

        return courses

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

                        clean_topic = clean_title_text(raw_topic, course['code'])
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
                            "is_new": is_new
                        })
                except Exception as fe:
                    print(f"    [!] Error reading forum {forum_title}: {fe}")

        except Exception as e:
            print(f"[!] Error reading course {course_name}: {e}")

        return updates

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    user = os.getenv("OUSL_USERNAME")
    pwd = os.getenv("OUSL_PASSWORD")
    if user and pwd:
        crawler = OUSLCrawler(user, pwd)
        asyncio.run(crawler.run())
