# 🎓 OUSL LMS Daily Watcher & Digest

An automated watcher for **The Open University of Sri Lanka (OUSL)** Moodle Learning Management System (`oulms.ou.ac.lk`) and Keycloak IAM (`iam.ou.ac.lk`).

It logs into your student account, checks the selected enrolled courses, indexes their Moodle sections and learning resources, extracts new announcements and portal notifications, and powers the web dashboard.

---

## 🚀 Features

- **Automated IAM & Moodle Login**: Seamlessly handles OpenID Connect OAuth2 authentication.
- **Structured Course Index**: Captures Moodle sections, labels, readings, files, recordings, links, forums, assignments, quizzes, books, folders, and lessons—including nested files, chapters, and embedded links.
- **Course Explorer**: Opens each enrolled course as a section-by-section content map.
- **Exam Preparation**: Regroups indexed material into ILS sessions, core/additional reading, projects/assessments, and exam/revision resources.
- **Portal Notifications**: Extracts recent grades, CAT/quiz announcements, viva notices, and system alerts.
- **Smart Deduplication (`seen_items.json`)**: Only notifies you about **new** items since the last check.
- **Multi-channel Alerts**:
  - 📱 **Telegram Bot** (Instant push notification with direct links)
  - 💬 **Discord Webhook** (Formatted embed cards)
  - ✉️ **Email (SMTP)** (Daily morning/evening digest)
- **Scheduled Automation**: Ready for **GitHub Actions** (cloud) or **macOS Cron/Launchd** (local).

---

## 📁 Project Structure

```
├── .github/workflows/
│   └── lms_check.yml       # Cloud scheduler (Runs 3x daily: 7 AM, 4 PM, 10 PM SL time)
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

### 2. Configure local credentials in `.env.local`
Edit the git-ignored `.env.local` file created in the project root:
```env
OUSL_USERNAME=your_student_id@ousl.lk
OUSL_PASSWORD=your_password
SELECTED_COURSES=AGM4367,EEI4267,EEI4360,EEI4361,EEI4362,EER4189,BSE

# Used by the hosted Vercel app to dispatch GitHub Actions:
GITHUB_REPOSITORY=nipunyatawara-dev/oulms-digest
GITHUB_TOKEN=your_fine_grained_github_token

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

The dashboard does not collect credentials. Its **Course Selector** discovers courses using these environment variables locally, or the existing GitHub Actions secrets in production.

### Sync status and new-post history

- `data/seen_items.json` stores hashed item identities and is committed with the digest. Scheduled and manual workflows run one at a time so they share the latest history.
- Existing digest entries seed that history on migration. A post is **New** when first discovered; changing relative dates or replies to an existing discussion do not make the same post new again.
- Cloud **Sync Now** tracks the exact GitHub run, then waits for that run's data to appear in the deployed site before showing 100%. Queued, running, saving, publishing, and failure states remain distinct. Refreshing the page resumes tracking the existing run.
- The server uses GitHub's [versioned workflow dispatch API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event) to obtain a run ID. The configured token needs Actions read/write access; it stays on the server.

Regression checks: `python3 -m unittest discover -s tests -v`, `node --test tests/githubSync.test.mjs`, and `npm run build`.

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

You don't need to keep your laptop on! You can let GitHub run this three times daily:

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
4. The workflow in `.github/workflows/lms_check.yml` will automatically run at **07:00 AM**, **04:00 PM**, and **10:00 PM** Sri Lanka Time (UTC+5:30) every day.

---

## ⏰ Running Locally on macOS (Cron Schedule)

If you prefer running locally on your Mac:
1. Open terminal and run `crontab -e`.
2. Add the following lines (runs at 7:30 AM and 7:30 PM):
   ```cron
   30 7,19 * * * cd /Users/shockagg/Documents/antigravity/amazing-raman && /Users/shockagg/Documents/antigravity/amazing-raman/.venv/bin/python main.py >> /tmp/lms_watcher.log 2>&1
   ```
