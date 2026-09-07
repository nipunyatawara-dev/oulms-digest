import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from crawler import LoginResult, classify_login_exception, OUSLCrawler


class CrawlerErrorClassificationTests(unittest.TestCase):
    def test_classify_network_timeout(self):
        err = Exception("Page.goto: Timeout 45000ms exceeded.")
        err_type, msg = classify_login_exception(err)
        self.assertEqual(err_type, "network_timeout")
        self.assertIn("connection timed out", msg.lower())

    def test_classify_connection_timed_out(self):
        err = Exception("Page.goto: net::ERR_CONNECTION_TIMED_OUT at https://oulms.ou.ac.lk/login/index.php")
        err_type, msg = classify_login_exception(err)
        self.assertEqual(err_type, "network_timeout")
        self.assertIn("connection timed out", msg.lower())

    def test_classify_dns_resolution_failure(self):
        err = Exception("Page.goto: net::ERR_NAME_NOT_RESOLVED at https://oulms.ou.ac.lk")
        err_type, msg = classify_login_exception(err)
        self.assertEqual(err_type, "network_timeout")

    def test_classify_generic_browser_error(self):
        err = RuntimeError("Target page, context or browser has been closed")
        err_type, msg = classify_login_exception(err)
        self.assertEqual(err_type, "browser_error")
        self.assertIn("Target page", msg)

    def test_login_result_to_dict(self):
        success_res = LoginResult(success=True)
        self.assertEqual(success_res.to_dict(), {"success": True})

        fail_res = LoginResult(
            success=False,
            error_type="network_timeout",
            message="Server unreachable",
            details="net::ERR_CONNECTION_TIMED_OUT"
        )
        data = fail_res.to_dict()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "Server unreachable")
        self.assertEqual(data["error_type"], "network_timeout")
        self.assertEqual(data["details"], "net::ERR_CONNECTION_TIMED_OUT")


class CrawlerLoginRetryTests(unittest.IsolatedAsyncioTestCase):
    async def test_login_network_timeout_retries_and_returns_network_error(self):
        crawler = OUSLCrawler(username="test_user", password="test_password")

        mock_page = AsyncMock()
        mock_page.goto.side_effect = Exception("Page.goto: Timeout 60000ms exceeded.")
        mock_page.close = AsyncMock()

        mock_context = MagicMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)

        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            page, login_res = await crawler._login(mock_context, max_attempts=2)

        self.assertIsNone(page)
        self.assertFalse(login_res.success)
        self.assertEqual(login_res.error_type, "network_timeout")
        self.assertEqual(mock_page.goto.call_count, 2)
        mock_sleep.assert_called_once()

    async def test_login_bad_credentials_short_circuits_immediately(self):
        crawler = OUSLCrawler(username="test_user", password="wrong_password")

        mock_page = AsyncMock()
        mock_page.goto = AsyncMock()
        mock_page.query_selector = AsyncMock(return_value=None)
        
        mock_username_input = AsyncMock()
        mock_password_input = AsyncMock()
        mock_page.wait_for_selector = AsyncMock(side_effect=[mock_username_input, mock_password_input])
        mock_page.wait_for_load_state = AsyncMock()
        mock_page.wait_for_timeout = AsyncMock()
        mock_page.keyboard = MagicMock()
        mock_page.keyboard.press = AsyncMock()

        # Feedback error element indicating invalid password
        mock_feedback = AsyncMock()
        mock_feedback.inner_text = AsyncMock(return_value="Invalid username or password.")

        async def mock_query(sel):
            if "kc-feedback" in sel or "alert-error" in sel:
                return mock_feedback
            return None

        mock_page.query_selector = AsyncMock(side_effect=mock_query)
        mock_page.close = AsyncMock()

        mock_context = MagicMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)

        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            page, login_res = await crawler._login(mock_context, max_attempts=3)

        self.assertIsNone(page)
        self.assertFalse(login_res.success)
        self.assertEqual(login_res.error_type, "auth_error")
        self.assertIn("Authentication failed", login_res.message)
        # Should short circuit on attempt 1 without sleeping for retries
        mock_sleep.assert_not_called()
        self.assertEqual(mock_page.goto.call_count, 1)


if __name__ == "__main__":
    unittest.main()
