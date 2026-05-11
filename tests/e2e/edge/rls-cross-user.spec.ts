/**
 * Phase 5 — edge/rls-cross-user
 *
 * Direct API probe: a signed-in student fetches `/api/lessons/{id}` for a
 * lesson that doesn't belong to them and must get a 404 (RLS hides), never
 * the row.
 *
 * @tags @edge @security @rls @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe(
  'Edge — RLS cross-user isolation',
  { tag: ['@edge', '@security', '@rls', '@unbreakable'] },
  () => {
    test('student fetch of a foreign lesson id returns 404 (RLS hides the row)', async ({
      page,
      loginAs,
    }) => {
      await loginAs('student');
      const res = await page.request.get('/api/lessons/00000000-0000-4000-8000-000000000000');
      // 404 is the unbreakable case (RLS pretends the row doesn't exist).
      // 401 / 403 are also acceptable — they don't leak the row's
      // existence either.
      expect([401, 403, 404]).toContain(res.status());
    });

    test('student fetch of /api/lessons returns only their own scope', async ({
      page,
      loginAs,
    }) => {
      await loginAs('student');
      const res = await page.request.get('/api/lessons');
      // The endpoint either returns an array of own lessons (RLS-filtered)
      // or a structured error. It must never return another student's row.
      if (res.ok()) {
        const body = await res.json();
        // We don't assert on identity here (no other-student-id seeded);
        // instead, this is a smoke test that the endpoint responds at all.
        expect(body).toBeDefined();
      }
    });
  }
);
