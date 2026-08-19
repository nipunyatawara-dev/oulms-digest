import os
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List

class Notifier:
    def __init__(self):
        self.telegram_bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID")
        self.discord_webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
        
        # Email config
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.email_to = os.getenv("EMAIL_TO")

    def format_report_telegram(self, notifications: List[Dict], course_updates: List[Dict]) -> str:
        lines = ["🎓 <b>OUSL LMS Daily Digest</b>\n"]

        if not notifications and not course_updates:
            lines.append("✅ <i>No new notifications or announcements today!</i>")
            return "\n".join(lines)

        if notifications:
            lines.append(f"🔔 <b>New Portal Notifications ({len(notifications)}):</b>")
            for n in notifications:
                text = n.get('text', '').replace('<', '&lt;').replace('>', '&gt;')
                time_ago = n.get('time', '')
                if time_ago:
                    lines.append(f"• <b>{text}</b> <i>({time_ago})</i>")
                else:
                    lines.append(f"• <b>{text}</b>")
            lines.append("")

        if course_updates:
            lines.append(f"📚 <b>New Course Announcements & Posts ({len(course_updates)}):</b>")
            for item in course_updates:
                course = item.get('course_name', 'Course')
                topic = item.get('topic', 'Update').replace('<', '&lt;').replace('>', '&gt;')
                author = item.get('author', '').replace('<', '&lt;').replace('>', '&gt;')
                link = item.get('link', '')
                time_str = item.get('time', '')

                author_str = f" by <i>{author}</i>" if author else ""
                time_info = f" [{time_str}]" if time_str else ""
                
                if link:
                    lines.append(f"• <b>{course}</b>:\n  <a href=\"{link}\">{topic}</a>{author_str}{time_info}")
                else:
                    lines.append(f"• <b>{course}</b>: {topic}{author_str}{time_info}")
            lines.append("")

        return "\n".join(lines)

    def send_telegram(self, message: str) -> bool:
        if not self.telegram_bot_token or not self.telegram_chat_id:
            return False
        
        url = f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage"
        payload = {
            "chat_id": self.telegram_chat_id,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        }
        try:
            res = requests.post(url, json=payload, timeout=15)
            if res.status_code == 200:
                print("[+] Telegram notification sent successfully!")
                return True
            else:
                print(f"[!] Telegram API error ({res.status_code}): {res.text}")
                return False
        except Exception as e:
            print(f"[!] Telegram sending failed: {e}")
            return False

    def send_discord(self, notifications: List[Dict], course_updates: List[Dict]) -> bool:
        if not self.discord_webhook_url:
            return False

        fields = []
        if notifications:
            notif_text = "\n".join([f"• {n.get('text', '')}" for n in notifications[:10]])
            fields.append({"name": "🔔 Notifications", "value": notif_text[:1000], "inline": False})
        
        if course_updates:
            updates_text = "\n".join([f"• [{u.get('course_name')}]: [{u.get('topic')}]({u.get('link')})" for u in course_updates[:10]])
            fields.append({"name": "📚 Course Updates", "value": updates_text[:1000], "inline": False})

        if not fields:
            fields.append({"name": "Status", "value": "No new announcements or notifications."})

        embed = {
            "title": "🎓 OUSL LMS Daily Digest",
            "color": 3447003, # Blue
            "fields": fields
        }

        try:
            res = requests.post(self.discord_webhook_url, json={"embeds": [embed]}, timeout=15)
            if res.status_code in (200, 204):
                print("[+] Discord notification sent successfully!")
                return True
            else:
                print(f"[!] Discord Webhook error: {res.text}")
                return False
        except Exception as e:
            print(f"[!] Discord sending failed: {e}")
            return False

    def send_email(self, report_text: str) -> bool:
        if not (self.smtp_user and self.smtp_password and self.email_to):
            return False
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🎓 OUSL LMS Digest Notification"
        msg["From"] = self.smtp_user
        msg["To"] = self.email_to

        msg.attach(MIMEText(report_text, "plain"))

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.smtp_user, [self.email_to], msg.as_string())
            print("[+] Email sent successfully!")
            return True
        except Exception as e:
            print(f"[!] Email sending failed: {e}")
            return False

    def dispatch(self, notifications: List[Dict], course_updates: List[Dict]):
        tg_msg = self.format_report_telegram(notifications, course_updates)
        
        sent = False
        if self.telegram_bot_token and self.telegram_chat_id:
            sent = self.send_telegram(tg_msg) or sent

        if self.discord_webhook_url:
            sent = self.send_discord(notifications, course_updates) or sent

        if self.smtp_user and self.smtp_password and self.email_to:
            sent = self.send_email(tg_msg) or sent

        if not sent:
            print("\n" + "="*50)
            print("📢 LMS DIGEST REPORT (No external notifier configured)")
            print("="*50)
            print(tg_msg)
            print("="*50 + "\n")
