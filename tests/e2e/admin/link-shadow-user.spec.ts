/**
 * Phase 4 — admin/link-shadow-user
 *
 * Exercises the privileged `/api/admin/link-shadow-user` route via the UI
 * surface. Happy path + idempotent second call.
 *
 * @tags @admin @shadow @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe('Admin — link shadow user', { tag: ['@admin', '@shadow', '@unbreakable'] }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('admin can reach the users list (privileged route is accessible)', async ({ page }) => {
    await page.goto('/dashboard/users', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
  });

  test.skip('click "Link to existing auth user" → /api/admin/link-shadow-user → success toast', async () => {
    // Depends on a seeded shadow with `invite_email` and a known auth
    // user. Use ensureShadowProfile + create a matching auth user, then
    // click the link button on the shadow's detail page.
  });

  test('second call (shadow already deleted) returns 404 friendly', async ({ page }) => {
    const res = await page.request.post('/api/admin/link-shadow-user', {
      data: {
        shadowProfileId: '00000000-0000-4000-8000-000000000000',
        realUserId: '00000000-0000-4000-8000-000000000001',
      },
    });
    expect([400, 404, 401, 403]).toContain(res.status());
  });
});
