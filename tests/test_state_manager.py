import json
import os
import tempfile
import unittest
from unittest.mock import patch
from state_manager import StateManager


class SeenHistoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = os.path.join(self.temp.name, 'seen_items.json')

    def baseline(self):
        with open(os.path.join(self.temp.name, 'lms_data.json'), 'w') as f:
            json.dump({'notifications': [{'title': 'Marks released', 'link': 'https://lms/notice/1'}],
                       'courses': [{'updates': [{'topic': 'Exam dates', 'link': 'https://lms/forum/2'}]}]}, f)

    def test_existing_digest_is_migrated_without_false_new_items(self):
        self.baseline()
        state = StateManager(self.path)
        self.assertFalse(state.is_new('notification', 'Marks released', 'https://lms/notice/1', '3 days ago'))
        self.assertFalse(state.is_new('forum_post', 'Exam dates', 'https://lms/forum/2', '5 September'))
        self.assertTrue(state.is_new('forum_post', 'New assignment', 'https://lms/forum/3'))

    def test_history_survives_fresh_runners_even_when_item_leaves_snapshot(self):
        first = StateManager(self.path)
        first.mark_seen('notification', 'Marks', 'https://lms/1', '1 hour ago')
        first.save()
        second = StateManager(self.path)
        self.assertFalse(second.is_new('notification', 'Marks', 'https://lms/1', '2 days ago'))
        self.assertTrue(second.is_new('notification', 'Marks', 'https://lms/2', '2 days ago'))
        second.mark_seen('notification', 'New exam', 'https://lms/3')
        second.save()
        third = StateManager(self.path)
        self.assertFalse(third.is_new('notification', 'New exam', 'https://lms/3'))
        self.assertFalse(third.is_new('notification', 'Marks', 'https://lms/1'))

    def test_legacy_history_is_rebuilt_from_existing_digest(self):
        self.baseline()
        with open(self.path, 'w') as f:
            json.dump({'seen_ids': ['old-time-based-hash']}, f)
        state = StateManager(self.path)
        self.assertFalse(state.is_new('forum_post', 'Exam dates', 'https://lms/forum/2'))
        state.save()
        with open(self.path) as f:
            self.assertEqual(json.load(f)['version'], 2)

    def test_failed_save_does_not_destroy_previous_history(self):
        state = StateManager(self.path)
        state.mark_seen('notification', 'Old', 'https://lms/1')
        state.save()
        with open(self.path) as f:
            before = f.read()
        with patch('state_manager.os.replace', side_effect=OSError('disk full')):
            with self.assertRaises(OSError):
                state.save()
        with open(self.path) as f:
            self.assertEqual(f.read(), before)

    def test_new_install_marks_first_discovery_new(self):
        self.assertTrue(StateManager(self.path).is_new('forum_post', 'Hello', 'https://lms/1'))


if __name__ == '__main__':
    unittest.main()
