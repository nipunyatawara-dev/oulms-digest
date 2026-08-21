import argparse
import asyncio
import os
import sys
import json
from dotenv import load_dotenv
from crawler import OUSLCrawler, load_settings
from notifier import Notifier
from state_manager import StateManager

load_dotenv()

async def main():
    parser = argparse.ArgumentParser(description="OUSL LMS Notification & Announcement Watcher")
    parser.add_argument("--all", action="store_true", help="Fetch all announcements regardless of whether they were seen before")
    parser.add_argument("--dry-run", action="store_true", help="Do not save seen state to disk")
    parser.add_argument("--discover", action="store_true", help="Discover and save all enrolled courses without full crawl")
    parser.add_argument("--courses", type=str, help="Comma-separated list of course codes to target")
    parser.add_argument("--username", type=str, help="OUSL Username / Student ID")
    parser.add_argument("--password", type=str, help="OUSL Password")
    args = parser.parse_args()

    settings = load_settings()
    username = args.username or os.getenv("OUSL_USERNAME") or settings.get("ousl_username")
    password = args.password or os.getenv("OUSL_PASSWORD") or settings.get("ousl_password")

    if not username or not password:
        print("[!] Error: OUSL_USERNAME and OUSL_PASSWORD must be set in your .env file, settings.json, or CLI arguments.")
        sys.exit(1)

    target_courses = None
    if args.courses:
        target_courses = [c.strip() for c in args.courses.split(",") if c.strip()]

    state_mgr = StateManager() if not args.dry_run else None
    crawler = OUSLCrawler(
        username=username,
        password=password,
        state_manager=state_mgr,
        filter_seen=not args.all,
        target_courses=target_courses
    )

    if args.discover:
        print("🔍 Discovering enrolled courses from OUSL LMS...")
        result = await crawler.discover_courses()
        print(f"\n📊 Found {result.get('count', 0)} courses.")
        return

    print("🚀 Starting OUSL LMS Digest Check...")
    payload = await crawler.run()

    notifications = payload.get("notifications", []) if isinstance(payload, dict) else []
    course_updates = []
    if isinstance(payload, dict) and "courses" in payload:
        for c in payload["courses"]:
            if "updates" in c:
                course_updates.extend(c["updates"])

    print(f"\n📊 Summary: {len(notifications)} notifications, {len(course_updates)} course updates found.")
    
    notifier = Notifier()
    notifier.dispatch(notifications, course_updates)
    print("✨ Finished check successfully.")

if __name__ == "__main__":
    asyncio.run(main())

