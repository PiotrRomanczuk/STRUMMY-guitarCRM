/**
 * Phase 4 — integration/shadow-to-real-link
 *
 * Full cross-role: teacher invites alice@example.com via the shadow flow,
 * student signs up with that exact email, the `handle_new_user` trigger
 * auto-links the shadow → real user, the previously-assigned data shows up
 * on the student's dashboard.
 *
 * @tags @integration @shadow @unbreakable
 */

import { test, expect } from '../../fixtures';
import { ensureShadowProfile } from '../../helpers/helpers/seed';

test.describe(
  'Integration — shadow → real link on signup',
  { tag: ['@integration', '@shadow', '@unbreakable'] },
  () => {
    test.skip('happy path: shadow with invite_email → student signs up → linked + old data visible (TODO: requires deterministic email for new signups + a way to delete the test auth user before the run to keep idempotent)', async () => {
      const inviteEmail = `e2e-link-${Date.now()}@example.com`;
      await ensureShadowProfile({
        invite_email: inviteEmail,
        full_name: 'E2E Shadow Test',
      });
      // 1. Sign up with `inviteEmail` via /sign-up.
      // 2. Land on /dashboard.
      // 3. Query `/api/users/profile` and expect the shadow's id to now
      //    be the auth user's id (transfer_shadow_profile_references ran).
    });

    test('placeholder: ensureShadowProfile is callable from the spec setup', async () => {
      const id = await ensureShadowProfile({
        invite_email: `e2e-stub-${Date.now()}@example.com`,
        full_name: 'Stub Shadow',
      });
      expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    });
  }
);
