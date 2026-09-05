import json
import os
import hashlib
import tempfile
from typing import Set

STATE_FILE = os.path.join(os.path.dirname(__file__), "data", "seen_items.json")

class StateManager:
    def __init__(self, file_path: str = STATE_FILE):
        self.file_path = file_path
        self.seen_ids: Set[str] = set()
        self.load()
        self.seed_from_digest(os.path.join(os.path.dirname(file_path), "lms_data.json"))

    def _generate_id(self, item_type: str, title: str, link: str, time_str: str = "") -> str:
        # Relative display dates change every crawl. "New" means first discovered,
        # not that the same notice has aged or a discussion received a reply.
        raw = f"v2:{item_type}:{title.strip()}:{link.strip()}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("version") == 2:
                        self.seen_ids = set(data.get("seen_ids", []))
            except Exception as e:
                print(f"[!] Warning: Could not load state file: {e}")
                self.seen_ids = set()

    def seed_from_digest(self, digest_path: str):
        """Migrate existing snapshots without marking their old entries new again."""
        if not os.path.exists(digest_path):
            return
        with open(digest_path, "r", encoding="utf-8") as f:
            digest = json.load(f)
        for item in digest.get("notifications", []):
            self.mark_seen("notification", item.get("title", ""), item.get("link", ""))
        for course in digest.get("courses", []):
            for item in course.get("updates", []):
                self.mark_seen("forum_post", item.get("topic", ""), item.get("link", ""))

    def save(self):
        directory = os.path.dirname(os.path.abspath(self.file_path))
        os.makedirs(directory, exist_ok=True)
        # A failed save must fail the crawl instead of silently losing its history.
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=directory, delete=False) as f:
            temp_path = f.name
            json.dump({"version": 2, "seen_ids": sorted(self.seen_ids)}, f, indent=2)
        try:
            os.replace(temp_path, self.file_path)
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def is_new(self, item_type: str, title: str, link: str, time_str: str = "") -> bool:
        item_id = self._generate_id(item_type, title, link, time_str)
        return item_id not in self.seen_ids

    def mark_seen(self, item_type: str, title: str, link: str, time_str: str = ""):
        item_id = self._generate_id(item_type, title, link, time_str)
        self.seen_ids.add(item_id)
