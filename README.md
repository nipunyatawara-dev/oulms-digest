# 🎓 OUSL LMS Daily Watcher & Digest

An automated watcher for **The Open University of Sri Lanka (OUSL)** Moodle Learning Management System (`oulms.ou.ac.lk`) and Keycloak IAM (`iam.ou.ac.lk`).

It logs into your student account, checks all your enrolled courses, extracts new announcements, forum discussions, and portal notifications, and delivers a formatted digest to **Telegram**, **Discord**, or **Email** twice daily.

---

## 🚀 Features

- **Automated IAM & Moodle Login**: Seamlessly handles OpenID Connect OAuth2 authentication.
- **Scrapes All Enrolled Courses**: Traverses announcements, forums, and discussion boards.
- **Portal Notifications**: Extracts recent grades, CAT/quiz announcements, viva notices, and system alerts.
- **Smart Deduplication (`seen_items.json`)**: Only notifies you about **new** items since the last check.
- **Multi-channel Alerts**:
  - 📱 **Telegram Bot** (Instant push notification with direct links)
  - 💬 **Discord Webhook** (Formatted embed cards)
  - ✉️ **Email (SMTP)** (Daily morning/evening digest)
- **Twice Daily Automation**: Ready for **GitHub Actions** (cloud) or **macOS Cron/Launchd** (local).

---

## 📁 Project Structure

```
├── .github/workflows/
│   └── lms_check.yml       # Cloud scheduler (Runs 2x daily: 7 AM & 7 PM SL time)
├── crawler.py              # Playwright browser automation & scraper
├── notifier.py             # Telegram, Discord, and Email dispatcher
├── state_manager.py        # Deduplication tracker (remembers seen posts)
├── main.py                 # CLI orchestrator
├── requirements.txt        # Python dependencies
├── .env                    # Local environment secrets (ignored by git)
└── .env.example            # Template for environment secrets
```

---

## ⚙️ Quick Start (Local)

### 1. Activate Environment & Install Dependencies
```bash
# If using the existing virtual environment:
source .venv/bin/activate

# Or to create a fresh one:
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

### 2. Configure Credentials in `.env`
Edit your `.env` file:
```env
OUSL_USERNAME=your_student_id@ousl.lk
OUSL_PASSWORD=your_password

# Choose your notification channel:
# --- Option A: Telegram (Recommended) ---
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# --- Option B: Discord Webhook ---
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# --- Option C: Email (SMTP) ---
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_TO=your_email@gmail.com
```

### 3. Run Manually
```bash
# Normal check (only outputs new items):
python main.py

# View all announcements (ignores deduplication filter):
python main.py --all

# Test without saving seen state:
python main.py --dry-run
```

---

## 📱 Setting Up Telegram Notifications (Takes 2 mins)

1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`, choose a name and username, and copy the **HTTP API Token** into `TELEGRAM_BOT_TOKEN`.
3. Search for `@userinfobot` on Telegram and send `/start` to get your numerical ID. Copy it into `TELEGRAM_CHAT_ID`.
4. Send `/start` to your newly created bot so it has permission to message you.

---

## ☁️ Running 100% Free on the Cloud (GitHub Actions)

You don't need to keep your laptop on! You can let GitHub run this twice daily:

1. Create a **Private** repository on GitHub.
2. Push this codebase to your repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. Go to **Settings > Secrets and variables > Actions > New repository secret** in your GitHub repo and add:
   - `OUSL_USERNAME`
   - `OUSL_PASSWORD`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
4. The workflow in `.github/workflows/lms_check.yml` will automatically run at **07:00 AM** and **07:00 PM** Sri Lanka Time (UTC+5:30) every day.

---

## ⏰ Running Locally on macOS (Cron Schedule)

If you prefer running locally on your Mac:
1. Open terminal and run `crontab -e`.
2. Add the following lines (runs at 7:30 AM and 7:30 PM):
   ```cron
   30 7,19 * * * cd /Users/shockagg/Documents/antigravity/amazing-raman && /Users/shockagg/Documents/antigravity/amazing-raman/.venv/bin/python main.py >> /tmp/lms_watcher.log 2>&1
   ```
