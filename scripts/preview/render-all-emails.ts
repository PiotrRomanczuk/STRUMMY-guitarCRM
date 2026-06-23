#!/usr/bin/env tsx
/**
 * Render every email the app can emit into a single gallery HTML for visual review.
 * Layer A = Supabase GoTrue auth emails. Layer B = app transactional templates.
 * Output: scripts/preview/out/gallery.html (+ one file per email).
 */
import fs from 'node:fs';
import path from 'node:path';

process.env.NEXT_PUBLIC_APP_URL ||= 'https://strummy.vercel.app';
const OUT = path.resolve(process.cwd(), 'scripts/preview/out');
fs.mkdirSync(OUT, { recursive: true });

type Item = { id: string; label: string; layer: 'A' | 'B'; sends: string; html: string };
const items: Item[] = [];
const add = (id: string, label: string, layer: 'A' | 'B', sends: string, html: string) =>
  items.push({ id, label, layer, sends, html });

// ── Layer A: GoTrue auth emails ──────────────────────────────────────────────
const fillGoTrue = (tpl: string) =>
  tpl
    .replaceAll('{{ .ConfirmationURL }}', 'https://strummy.vercel.app/auth/confirm?token=abc123')
    .replaceAll('{{ .Token }}', '481920')
    .replaceAll('{{ .Email }}', 'student@example.com')
    .replaceAll('{{ .NewEmail }}', 'new.address@example.com');

// All 5 GoTrue templates are now custom-designed (config.toml content_path overrides).
const authTemplates: Array<[string, string, string, string]> = [
  ['auth-invite', 'Student invite', 'inviteUserByEmail', 'invite.html'],
  ['auth-confirmation', 'Signup confirmation', 'self-serve teacher signup', 'confirmation.html'],
  ['auth-magiclink', 'Magic link', 'passwordless login', 'magic_link.html'],
  ['auth-recovery', 'Password reset', 'forgot-password', 'recovery.html'],
  ['auth-emailchange', 'Email change', 'change email address', 'email_change.html'],
];
for (const [id, label, sends, file] of authTemplates) {
  const tpl = fs.readFileSync(path.resolve(`supabase/templates/${file}`), 'utf8');
  add(id, label, 'A', sends, fillGoTrue(tpl));
}

// ── Layer B: app transactional templates ─────────────────────────────────────
async function renderB() {
  const T = 'lib/email/templates';
  const safe = (id: string, label: string, sends: string, fn: () => string) => {
    try {
      add(id, label, 'B', sends, fn());
    } catch (e) {
      add(id, `${label} — RENDER ERROR`, 'B', sends, `<pre>${String(e)}</pre>`);
    }
  };

  const m = async (f: string) => import(path.resolve(`${T}/${f}`));

  safe(
    'student-welcome',
    'Student welcome',
    'on student account creation',
    (await m('student-welcome.ts')).generateStudentWelcomeHtml.bind(null, {
      studentName: 'Emma Johnson',
      teacherName: 'Piotr',
      loginLink: 'https://strummy.vercel.app/login',
      firstLessonDate: 'Monday, 7 July 2026 at 16:00',
    })
  );

  safe(
    'lesson-reminder',
    'Lesson reminder (24h)',
    'lesson-reminders cron',
    (await m('lesson-reminder.ts')).generateLessonReminderHtml.bind(null, {
      studentName: 'Emma Johnson',
      lessonDate: 'Monday, 7 July 2026',
      lessonTime: '16:00',
      location: 'Studio A',
      agenda: 'Fingerpicking patterns + Blackbird intro',
    })
  );

  safe(
    'lesson-recap',
    'Lesson recap',
    'send-lesson-email / queue',
    (await m('lesson-recap.ts')).generateLessonRecapHtml.bind(null, {
      studentName: 'Emma Johnson',
      lessonDate: '23 June 2026',
      lessonTitle: 'Advanced Fingerstyle',
      notes: 'Great progress on thumb independence. Keep the metronome at 70bpm this week.',
      songs: [
        {
          title: 'Blackbird',
          artist: 'The Beatles',
          status: 'In Progress',
          notes: 'Bridge timing',
        },
        { title: 'Neon', artist: 'John Mayer', status: 'Started', notes: 'Thumb slap groove' },
      ],
    })
  );

  safe(
    'lesson-cancellation',
    'Lesson cancellation',
    'queue',
    (await m('lesson-cancellation.ts')).generateLessonCancellationHtml.bind(null, {
      studentName: 'Emma Johnson',
      teacherName: 'Piotr',
      lessonDate: 'Monday, 7 July 2026',
      lessonTime: '16:00',
      reason: 'Teacher unwell',
      rescheduleLink: 'https://strummy.vercel.app/dashboard/lessons',
    })
  );

  safe(
    'lesson-rescheduled',
    'Lesson rescheduled',
    'queue',
    (await m('lesson-rescheduled-notification.ts')).generateLessonRescheduledHtml.bind(null, {
      studentName: 'Emma Johnson',
      teacherName: 'Piotr',
      oldDate: 'Mon, 7 Jul 2026',
      oldTime: '16:00',
      newDate: 'Wed, 9 Jul 2026',
      newTime: '17:30',
    })
  );

  safe(
    'assignment-created',
    'Assignment created',
    'on assignment create + queue',
    (await m('assignment-created.ts')).generateAssignmentCreatedHtml.bind(null, {
      studentName: 'Emma Johnson',
      assignmentTitle: 'Practice Am pentatonic',
      assignmentDescription: 'Run the shape 1 pentatonic at 80bpm, 10 min/day.',
      dueDate: '30 June 2026',
      teacherName: 'Piotr',
      assignmentLink: 'https://strummy.vercel.app/dashboard/assignments',
    })
  );

  safe(
    'assignment-due-reminder',
    'Assignment due reminder',
    'assignment-due-reminders cron',
    (await m('assignment-due-reminder.ts')).generateAssignmentDueReminderHtml.bind(null, {
      studentName: 'Emma Johnson',
      assignmentTitle: 'Practice Am pentatonic',
      dueDate: 'tomorrow, 30 June 2026',
      assignmentDescription: '10 min/day at 80bpm.',
      assignmentLink: 'https://strummy.vercel.app/dashboard/assignments',
    })
  );

  safe(
    'assignment-overdue-alert',
    'Assignment overdue alert',
    'assignment-overdue-check cron',
    (await m('assignment-overdue-alert.ts')).generateAssignmentOverdueAlertHtml.bind(null, {
      studentName: 'Emma Johnson',
      assignmentTitle: 'Practice Am pentatonic',
      dueDate: '25 June 2026',
      daysOverdue: 3,
      assignmentLink: 'https://strummy.vercel.app/dashboard/assignments',
    })
  );

  safe(
    'assignment-completed',
    'Assignment completed',
    'on completion + queue',
    (await m('assignment-completed.ts')).generateAssignmentCompletedHtml.bind(null, {
      studentName: 'Emma Johnson',
      assignmentTitle: 'Practice Am pentatonic',
      completedDate: '28 June 2026',
      teacherName: 'Piotr',
    })
  );

  safe(
    'song-mastery-achievement',
    'Song mastery achievement',
    'queue',
    (await m('song-mastery-achievement.ts')).generateSongMasteryAchievementHtml.bind(null, {
      studentName: 'Emma Johnson',
      songTitle: 'Blackbird',
      songArtist: 'The Beatles',
      masteredDate: '23 June 2026',
      totalSongsMastered: 7,
    })
  );

  safe(
    'milestone-reached',
    'Milestone reached',
    'queue',
    (await m('milestone-reached.ts')).generateMilestoneReachedHtml.bind(null, {
      studentName: 'Emma Johnson',
      milestone: '10 lessons completed',
      milestoneDescription: 'Double digits — nice consistency!',
      achievedDate: '23 June 2026',
    })
  );

  safe(
    'trial-ending-reminder',
    'Trial ending reminder',
    'queue',
    (await m('trial-ending-reminder.ts')).generateTrialEndingReminderHtml.bind(null, {
      studentName: 'Emma Johnson',
      trialEndDate: '1 July 2026',
      daysRemaining: 3,
      upgradeLink: 'https://strummy.vercel.app/dashboard/settings',
    })
  );

  safe(
    'weekly-progress-digest',
    'Weekly progress digest',
    'weekly-digest cron',
    (await m('weekly-progress-digest.ts')).generateWeeklyProgressDigestHtml.bind(null, {
      recipientName: 'Emma Johnson',
      weekStart: '16 Jun',
      weekEnd: '22 Jun 2026',
      lessonsCompleted: 2,
      songsMastered: 1,
      practiceTime: 145,
      highlights: ['Nailed the Blackbird intro', 'First barre chord held clean'],
      upcomingLessons: [{ date: 'Mon 7 Jul', title: 'Fingerstyle II' }],
    })
  );

  safe(
    'teacher-daily-summary',
    'Teacher daily summary',
    'daily-report cron',
    (await m('teacher-daily-summary.ts')).generateTeacherDailySummaryHtml.bind(null, {
      teacherName: 'Piotr',
      date: 'Monday, 23 June 2026',
      upcomingLessons: [
        { studentName: 'Emma Johnson', time: '16:00', title: 'Fingerstyle II' },
        { studentName: 'Carlos Reyes', time: '17:30', title: 'Blues turnaround' },
      ],
      completedLessons: 3,
      pendingAssignments: 4,
      recentAchievements: [{ studentName: 'Lily Park', achievement: 'Mastered "Wonderwall"' }],
    })
  );

  safe(
    'weekly-insights',
    'Weekly insights (teacher)',
    'weekly-insights cron',
    (await m('weekly-insights.ts')).generateWeeklyInsightsHtml.bind(null, {
      teacherName: 'Piotr',
      dateRange: { start: '2026-06-16', end: '2026-06-22' },
      lessonsCompleted: 9,
      lessonsCancelled: 1,
      newStudents: [{ name: 'Nadia Kaczkowska', email: 'nadia@example.com' }],
      songsMastered: [
        { studentName: 'Lily Park', songTitle: 'Wonderwall', masteredAt: '2026-06-20' },
      ],
      atRiskStudents: [{ name: 'Carlos Reyes', healthScore: 42, overdueAssignments: 2 }],
      overdueAssignments: [
        { studentName: 'Carlos Reyes', assignmentTitle: 'Blues scale', dueDate: '2026-06-18' },
      ],
    })
  );

  safe(
    'admin-song-report',
    'Admin morning briefing',
    'daily-report cron (admin)',
    (await m('admin-song-report.ts')).generateAdminSongReportHtml.bind(null, {
      songs: {
        totalSongs: 384,
        coverage: { chords: 31, youtube: 64, ultimateGuitar: 22, galleryImages: 18 },
        counts: {
          withChords: 119,
          withYoutube: 246,
          withUltimateGuitar: 84,
          withGalleryImages: 69,
        },
        missing: {
          chords: [{ id: '1', title: 'Hey Jude', artist: 'The Beatles' }],
          youtube: [{ id: '2', title: 'Creep', artist: 'Radiohead' }],
          ultimateGuitar: [{ id: '3', title: 'Yellow', artist: 'Coldplay' }],
        },
      },
      students: { total: 21, newThisWeek: 2 },
      lessons: { today: 3, upcoming: 11 },
    })
  );

  safe(
    'calendar-conflict-alert',
    'Calendar conflict alert',
    'calendar-sync cron',
    (await m('calendar-conflict-alert.ts')).generateCalendarConflictAlertHtml.bind(null, {
      teacherName: 'Piotr',
      conflictDate: 'Mon, 7 Jul 2026',
      conflictTime: '16:00',
      lesson1: 'Emma Johnson — Fingerstyle II',
      lesson2: 'Carlos Reyes — Blues',
      resolveLink: 'https://strummy.vercel.app/dashboard/calendar',
    })
  );

  safe(
    'webhook-expiration-notice',
    'Webhook expiration notice',
    'renew-webhooks cron',
    (await m('webhook-expiration-notice.ts')).generateWebhookExpirationNoticeHtml.bind(null, {
      teacherName: 'Piotr',
      serviceName: 'Google Calendar',
      expirationDate: '30 June 2026',
      renewLink: 'https://strummy.vercel.app/dashboard/settings',
    })
  );

  safe(
    'admin-error-alert',
    'Admin error alert',
    'admin-monitoring',
    (await m('admin-error-alert.ts')).generateAdminErrorAlertHtml.bind(null, {
      adminName: 'Piotr',
      errorType: 'CronFailure',
      errorMessage: 'process-notification-queue timed out',
      timestamp: '2026-06-23T06:00:00Z',
      affectedService: 'notifications',
      stackTrace: 'Error: ETIMEDOUT\n  at processQueue (queue.ts:42)',
    })
  );
}

async function main() {
  await renderB();

  // ── Build gallery ────────────────────────────────────────────────────────────
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  items.forEach((it) => fs.writeFileSync(path.join(OUT, `${it.id}.html`), it.html));

  const card = (it: Item) => `
  <section class="card">
    <div class="meta">
      <span class="badge layer-${it.layer}">Layer ${it.layer}</span>
      <h2>${it.label}</h2>
      <code>${it.sends}</code>
    </div>
    <iframe loading="lazy" srcdoc="${esc(it.html)}"></iframe>
  </section>`;

  const gallery = `<!doctype html><html><head><meta charset="utf-8">
<title>Strummy — all email previews</title>
<style>
  body{margin:0;background:#1c1917;color:#e7e5e4;font-family:-apple-system,Segoe UI,Roboto,sans-serif}
  header{padding:24px 32px;border-bottom:1px solid #44403c}
  header h1{margin:0 0 4px;font-size:20px}header p{margin:0;color:#a8a29e;font-size:13px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:24px;padding:32px}
  .card{background:#292524;border:1px solid #44403c;border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
  .meta{padding:14px 16px;border-bottom:1px solid #44403c}
  .meta h2{margin:6px 0 4px;font-size:15px}
  .meta code{font-size:11px;color:#a8a29e}
  .badge{display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:.05em}
  .layer-A{background:#422006;color:#fbbf24}.layer-B{background:#0c2f1f;color:#4ade80}
  iframe{width:100%;height:640px;border:0;background:#fff}
</style></head><body>
<header><h1>Strummy — every outbound email (${items.length})</h1>
<p>Layer A = Supabase GoTrue auth · Layer B = app transactional. Rendered ${new Date().toISOString().slice(0, 10)} with sample data.</p></header>
<div class="grid">${items.map(card).join('')}</div>
</body></html>`;

  fs.writeFileSync(path.join(OUT, 'gallery.html'), gallery);
  console.log(`Rendered ${items.length} emails → ${path.join(OUT, 'gallery.html')}`);
  items.forEach((it) => console.log(`  [${it.layer}] ${it.label}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
