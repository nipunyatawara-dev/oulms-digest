import json
import os
import hashlib
from typing import Set

STATE_FILE = "seen_items.json"

class StateManager:
    def __init__(self, file_path: str = STATE_FILE):
        self.file_path = file_path
        self.seen_ids: Set[str] = set()
        self.load()

    def _generate_id(self, item_type: str, title: str, link: str, time_str: str = "") -> str:
        raw = f"{item_type}:{title}:{link}:{time_str}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.seen_ids = set(data.get("seen_ids", []))
            except Exception as e:
                print(f"[!] Warning: Could not load state file: {e}")
                self.seen_ids = set()

    def save(self):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump({"seen_ids": list(self.seen_ids)}, f, indent=2)
        except Exception as e:
            print(f"[!] Error saving state file: {e}")

    def is_new(self, item_type: str, title: str, link: str, time_str: str = "") -> bool:
        item_id = self._generate_id(item_type, title, link, time_str)
        return item_id not in self.seen_ids

    def mark_seen(self, item_type: str, title: str, link: str, time_str: str = ""):
        item_id = self._generate_id(item_type, title, link, time_str)
        self.seen_ids.add(item_id)
