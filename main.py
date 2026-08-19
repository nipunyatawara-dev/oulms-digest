import argparse
import asyncio
import os
import sys
from dotenv import load_dotenv
from crawler import OUSLCrawler
from notifier import Notifier
from state_manager import StateManager

load_dotenv()

async def main():
    parser = argparse.ArgumentParser(description="OUSL LMS Notification & Announcement Watcher")
    parser.add_argument("--all", action="store_true", help="Fetch all announcements regardless of whether they were seen before")
    parser.add_argument("--dry-run", action="store_true", help="Do not save seen state to disk")
    args = parser.parse_args()

    username = os.getenv("OUSL_USERNAME")
    password = os.getenv("OUSL_PASSWORD")

    if not username or not password:
        print("[!] Error: OUSL_USERNAME and OUSL_PASSWORD must be set in your .env file or environment variables.")
        sys.exit(1)

    print("🚀 Starting OUSL LMS Digest Check...")
    state_mgr = StateManager() if not args.dry_run else None
    crawler = OUSLCrawler(
        username=username,
        password=password,
        state_manager=state_mgr,
        filter_seen=not args.all
    )

    notifications, course_updates = await crawler.run()

    print(f"\n📊 Summary: {len(notifications)} notifications, {len(course_updates)} course updates found.")
    
    notifier = Notifier()
    notifier.dispatch(notifications, course_updates)
    print("✨ Finished check successfully.")

if __name__ == "__main__":
    asyncio.run(main())
