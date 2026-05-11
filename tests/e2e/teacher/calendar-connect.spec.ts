/**
 * Phase 2 — teacher/calendar-connect
 *
 * Google Calendar OAuth + event-list rendering with `stubGoogleOAuth` +
 * `stubGoogleCalendar`. The real OAuth handshake is replaced by a stub so
 * the suite is deterministic and CI-runnable.
 *
 * @tags @teacher @calendar @integration @unbreakable
 */

import { test, expect } from '../../fixtures';
import { stubGoogleOAuth, stubGoogleCalendar } from '../../helpers/helpers/stubs';

test.describe(
  'Teacher — Google Calendar connect',
  { tag: ['@teacher', '@calendar', '@integration', '@unbreakable'] },
  () => {
    test.beforeEach(async ({ loginAs, page }) => {
      await loginAs('teacher');
      await stubGoogleOAuth(page);
      await stubGoogleCalendar(page, [
        {
          id: 'evt-1',
          summary: 'E2E Stubbed Event',
          start: { dateTime: '2026-05-15T14:00:00Z' },
        },
      ]);
    });

    test('calendar page renders + Connect Google button visible', async ({ page }) => {
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      const connectBtn = page
        .getByRole('button', { name: /connect google|sync|reconnect/i })
        .first();
      const connectLink = page.getByRole('link', { name: /connect google|sync/i }).first();
      const visible =
        (await connectBtn.isVisible().catch(() => false)) ||
        (await connectLink.isVisible().catch(() => false));
      expect(visible).toBe(true);
    });

    test.skip('connected state → stubbed events render in the list (TODO: needs persisted user_integrations row from a previous run)', async () => {
      // After completing the stubbed OAuth, the calendar list should
      // render the seeded event.
    });
  }
);
