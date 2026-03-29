import { test } from '../../fixtures';

const OUT = 'screenshots/demo';

/**
 * Demo Account Screenshot Capture
 *
 * Takes screenshots of every key page as the demo user (sarah@strummy.app)
 * across mobile (390x844) and desktop (1440x900) viewports.
 */
test.describe.serial('Demo Screenshots', { tag: ['@demo', '@screenshots'] }, () => {

  const MOBILE = { width: 390, height: 844 };
  const DESKTOP = { width: 1440, height: 900 };

  test.setTimeout(180_000);

  async function waitAndScreenshot(
    page: import('@playwright/test').Page,
    name: string,
    opts?: { selector?: string }
  ) {
    await page.waitForLoadState('networkidle');
    if (opts?.selector) {
      try { await page.waitForSelector(opts.selector, { timeout: 15000 }); } catch { /* data may not exist */ }
    }
    try {
      await page.waitForFunction(() => document.querySelectorAll('.animate-pulse').length === 0, { timeout: 8000 });
    } catch { /* some pages have pulse elements */ }
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  }

  // ─── Desktop Screenshots ──────────────────────────────────────────
  test('Desktop — all pages', async ({ page, loginAs }) => {
    await loginAs('demo');
    await page.setViewportSize(DESKTOP);

    // 1. Dashboard
    await page.goto('/dashboard');
    await waitAndScreenshot(page, '01-dashboard--desktop');

    // 2. Lessons
    await page.goto('/dashboard/lessons');
    await waitAndScreenshot(page, '02-lessons--desktop', { selector: 'table, [data-testid="lesson-card"]' });

    // 3. Songs
    await page.goto('/dashboard/songs');
    await waitAndScreenshot(page, '03-songs--desktop', { selector: 'table, [data-testid="song-card"]' });

    // 4. Assignments
    await page.goto('/dashboard/assignments');
    await waitAndScreenshot(page, '04-assignments--desktop');

    // 5. Users/Students
    await page.goto('/dashboard/users');
    await waitAndScreenshot(page, '05-users--desktop');

    // 6. Calendar
    await page.goto('/dashboard/calendar');
    await waitAndScreenshot(page, '06-calendar--desktop');

    // 7. Repertoire
    await page.goto('/dashboard/repertoire');
    await waitAndScreenshot(page, '07-repertoire--desktop');

    // 8. Theory
    await page.goto('/dashboard/theory');
    await waitAndScreenshot(page, '08-theory--desktop');

    // 9. Skills
    await page.goto('/dashboard/skills');
    await waitAndScreenshot(page, '09-skills--desktop');

    // 10. Stats
    await page.goto('/dashboard/stats');
    await waitAndScreenshot(page, '10-stats--desktop');

    // 11. AI Assistant
    await page.goto('/dashboard/ai');
    await waitAndScreenshot(page, '11-ai--desktop', { selector: '[data-testid="ai-messages"]' });

    // 12. Fretboard
    await page.goto('/dashboard/fretboard');
    await waitAndScreenshot(page, '12-fretboard--desktop');

    // 13. Settings
    await page.goto('/dashboard/settings');
    await waitAndScreenshot(page, '13-settings--desktop');

    // 14. Profile
    await page.goto('/dashboard/profile');
    await waitAndScreenshot(page, '14-profile--desktop');

    // 15. Notifications
    await page.goto('/dashboard/notifications');
    await waitAndScreenshot(page, '15-notifications--desktop');

    // 16. New Song form
    await page.goto('/dashboard/songs/new');
    await waitAndScreenshot(page, '16-song-new--desktop');

    // 17. New Lesson form
    await page.goto('/dashboard/lessons/new');
    await waitAndScreenshot(page, '17-lesson-new--desktop');

    // 18. New Assignment form
    await page.goto('/dashboard/assignments/new');
    await waitAndScreenshot(page, '18-assignment-new--desktop');
  });

  // ─── Mobile Screenshots ───────────────────────────────────────────
  test('Mobile — all pages', async ({ page, loginAs }) => {
    await loginAs('demo');
    await page.setViewportSize(MOBILE);

    // 1. Dashboard
    await page.goto('/dashboard');
    await waitAndScreenshot(page, '01-dashboard--mobile');

    // 2. Lessons
    await page.goto('/dashboard/lessons');
    await waitAndScreenshot(page, '02-lessons--mobile', { selector: '[data-testid="lesson-card"], table' });

    // 3. Songs
    await page.goto('/dashboard/songs');
    await waitAndScreenshot(page, '03-songs--mobile', { selector: '[data-testid="song-card"], table' });

    // 4. Assignments
    await page.goto('/dashboard/assignments');
    await waitAndScreenshot(page, '04-assignments--mobile');

    // 5. Users/Students
    await page.goto('/dashboard/users');
    await waitAndScreenshot(page, '05-users--mobile');

    // 6. Calendar
    await page.goto('/dashboard/calendar');
    await waitAndScreenshot(page, '06-calendar--mobile');

    // 7. Repertoire
    await page.goto('/dashboard/repertoire');
    await waitAndScreenshot(page, '07-repertoire--mobile');

    // 8. Theory
    await page.goto('/dashboard/theory');
    await waitAndScreenshot(page, '08-theory--mobile');

    // 9. Skills
    await page.goto('/dashboard/skills');
    await waitAndScreenshot(page, '09-skills--mobile');

    // 10. Stats
    await page.goto('/dashboard/stats');
    await waitAndScreenshot(page, '10-stats--mobile');

    // 11. AI Assistant
    await page.goto('/dashboard/ai');
    await waitAndScreenshot(page, '11-ai--mobile', { selector: '[data-testid="ai-messages"]' });

    // 12. Fretboard
    await page.goto('/dashboard/fretboard');
    await waitAndScreenshot(page, '12-fretboard--mobile');

    // 13. Settings
    await page.goto('/dashboard/settings');
    await waitAndScreenshot(page, '13-settings--mobile');

    // 14. Profile
    await page.goto('/dashboard/profile');
    await waitAndScreenshot(page, '14-profile--mobile');

    // 15. Notifications
    await page.goto('/dashboard/notifications');
    await waitAndScreenshot(page, '15-notifications--mobile');

    // 16. New Song form
    await page.goto('/dashboard/songs/new');
    await waitAndScreenshot(page, '16-song-new--mobile');

    // 17. New Lesson form
    await page.goto('/dashboard/lessons/new');
    await waitAndScreenshot(page, '17-lesson-new--mobile');

    // 18. New Assignment form
    await page.goto('/dashboard/assignments/new');
    await waitAndScreenshot(page, '18-assignment-new--mobile');
  });
});
