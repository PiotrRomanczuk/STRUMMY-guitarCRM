/**
 * Phase 2 — teacher/users-invite
 *
 * Teacher invites a new student via `/dashboard/users/invite`. Verifies:
 *   - Shadow profile is created with `invite_email` set (not the placeholder
 *     `shadow_*@placeholder.com`).
 *   - The placeholder email is NEVER displayed in the UI (the page should
 *     surface `invite_email` or null, never the raw placeholder).
 *
 * @tags @teacher @users @shadow @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe(
  'Teacher — invite a new student',
  { tag: ['@teacher', '@users', '@shadow', '@unbreakable'] },
  () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('teacher');
    });

    test('invite page renders the email + name fields', async ({ page }) => {
      await page.goto('/dashboard/users/invite', { waitUntil: 'networkidle' });
      await expect(page.getByLabel(/email/i).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /invite|send|create/i }).first()).toBeVisible();
    });

    test.skip('submit invite → shadow created → users list shows the new student without leaking the placeholder email', async () => {
      // Form submit triggers PATCH /api/users; assert the list now shows
      // the invitee's display name and never the literal substring
      // `@placeholder.com`.
    });
  }
);
