import { NextResponse } from 'next/server';
import { getLMSData } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = getLMSData();

  if (!data) {
    return new NextResponse('No data available. Please run a sync first.', { status: 404 });
  }

  const dateStr = new Date(data.synced_at || Date.now()).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = new Date(data.synced_at || Date.now()).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const notificationsHtml = data.notifications.length > 0
    ? data.notifications.map((n) => `
        <div class="item">
          <div class="item-title">${n.title}</div>
          <div class="item-meta">
            <span class="badge ${n.category.toLowerCase().replace(/[^a-z]/g, '-')}">${n.category}</span>
            <span>${n.time || ''}</span>
          </div>
        </div>
      `).join('')
    : '<div class="empty">No recent portal notifications.</div>';

  const coursesHtml = data.courses.map((c) => {
    if (!c.updates || c.updates.length === 0) return '';
    const updatesHtml = c.updates.map((u) => `
      <div class="update-row">
        <div class="update-topic">
          <a href="${u.link}" target="_blank" rel="noreferrer">${u.topic}</a>
        </div>
        <div class="update-meta">
          <span>${u.author ? u.author : 'Faculty'}</span>
          <span>&bull;</span>
          <span>${u.time}</span>
          <span class="badge ${u.category.toLowerCase().replace(/[^a-z]/g, '-')}">${u.category}</span>
        </div>
      </div>
    `).join('');

    return `
      <div class="course-section">
        <div class="course-header">
          <h3>${c.title}</h3>
          <span class="course-badge">${c.updates.length} Updates</span>
        </div>
        <div class="updates-list">
          ${updatesHtml}
        </div>
      </div>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OUSL LMS Academic Digest - ${dateStr}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background: #ffffff;
      line-height: 1.5;
      margin: 0;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      border-bottom: 2px solid #000;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header h1 {
      margin: 0;
      font-size: 20pt;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #000;
    }
    .header .sub {
      font-size: 10pt;
      color: #555;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .header .timestamp {
      font-size: 9pt;
      color: #666;
      text-align: right;
    }
    .stats-bar {
      display: flex;
      gap: 16px;
      background: #f7f7f8;
      border: 1px solid #e5e5ea;
      border-radius: 6px;
      padding: 8px 14px;
      margin-bottom: 24px;
      font-size: 9pt;
      color: #444;
    }
    .stats-bar strong {
      color: #000;
    }
    .section-title {
      font-size: 12pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 12px;
    }
    .item {
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .item-title {
      font-size: 10pt;
      font-weight: 600;
      color: #111;
    }
    .item-meta {
      font-size: 8.5pt;
      color: #666;
      margin-top: 2px;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .badge {
      display: inline-block;
      padding: 1px 6px;
      font-size: 7.5pt;
      font-weight: 600;
      border-radius: 3px;
      background: #eee;
      color: #444;
    }
    .badge.grades---marks {
      background: #e3f2fd;
      color: #0d47a1;
    }
    .badge.viva---exam {
      background: #fbe9e7;
      color: #bf360c;
    }
    .badge.deadlines---quizzes {
      background: #fff3e0;
      color: #e65100;
    }
    .course-section {
      margin-bottom: 16px;
      page-break-inside: avoid;
      border: 1px solid #e5e5ea;
      border-radius: 6px;
      overflow: hidden;
    }
    .course-header {
      background: #fafafa;
      border-bottom: 1px solid #e5e5ea;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .course-header h3 {
      margin: 0;
      font-size: 10.5pt;
      font-weight: 700;
      color: #000;
    }
    .course-badge {
      font-size: 8pt;
      font-weight: 600;
      color: #555;
      background: #fff;
      padding: 2px 8px;
      border: 1px solid #ddd;
      border-radius: 12px;
    }
    .updates-list {
      padding: 4px 12px;
    }
    .update-row {
      padding: 8px 0;
      border-bottom: 1px solid #f5f5f5;
    }
    .update-row:last-child {
      border-bottom: none;
    }
    .update-topic a {
      font-size: 9.5pt;
      font-weight: 600;
      color: #0044cc;
      text-decoration: none;
    }
    .update-meta {
      font-size: 8pt;
      color: #666;
      margin-top: 2px;
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 8pt;
      color: #888;
      display: flex;
      justify-content: space-between;
    }
    .no-print-bar {
      background: #111;
      color: #fff;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -24px -24px 20px -24px;
      font-size: 13px;
    }
    .print-btn {
      background: #0071e3;
      color: #fff;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span>📄 OUSL Academic Digest Preview</span>
    <button class="print-btn" onclick="window.print()">Save as PDF / Print</button>
  </div>

  <div class="header">
    <div>
      <h1>The Open University of Sri Lanka</h1>
      <div class="sub">Learning Management System &bull; Batch Digest Report</div>
    </div>
    <div class="timestamp">
      <div><strong>${dateStr}</strong></div>
      <div>Generated at ${timeStr}</div>
    </div>
  </div>

  <div class="stats-bar">
    <div>Enrolled Courses: <strong>${data.stats.total_courses}</strong></div>
    <div>Portal Notifications: <strong>${data.stats.total_notifications}</strong></div>
    <div>Course Announcements: <strong>${data.stats.total_updates}</strong></div>
  </div>

  <div class="section-title">Recent Portal Notifications & System Alerts</div>
  ${notificationsHtml}

  <div class="section-title" style="margin-top: 24px;">Course Announcements & Discussions</div>
  ${coursesHtml}

  <div class="footer">
    <span>OUSL Faculty of Engineering Technology &bull; Academic Year 2025/2026</span>
    <span>Generated for student batch sharing</span>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
