/**
 * Manual one-off test: onboard Kuba Spiridono end-to-end through the UI.
 *
 * Steps:
 *  1. Create shadow student profile (Kuba Spiridono, romanczukpiotr95@gmail.com)
 *  2. Import 41 songs from his lesson history
 *  3. Send the invite email
 *
 * Run against a non-protected deployment (sends a real email to romanczukpiotr95@gmail.com,
 * asserts via Gmail API — requires GMAIL_TEST_REFRESH_TOKEN in env):
 *   PLAYWRIGHT_BASE_URL=https://<deployment-url>.vercel.app \
 *   npx playwright test tests/e2e/manual/kuba-onboarding.spec.ts --headed --project="Desktop Chrome"
 *
 * Note: use a deployment URL that bypasses Vercel protection (e.g. from `vercel deploy`)
 * or set VERCEL_AUTOMATION_BYPASS_SECRET in env if deployment protection is enabled.
 *
 * Run against localhost (email goes to Inbucket, not Gmail):
 *   npx playwright test tests/e2e/manual/kuba-onboarding.spec.ts --headed --project="Desktop Chrome"
 */

import { createClient } from '@supabase/supabase-js';

import { test, expect } from '../../fixtures';
import { deleteAllMailpitMessages, waitForEmail } from '../../helpers/mailpit';
import { waitForGmailEmail } from '../../helpers/gmail';

const INVITE_EMAIL = 'romanczukpiotr95@gmail.com';

const SONGS = `Son of the Blue Sky, 26.08.2025
Anyone Else but You, The Moldy Peaches, 11.09.2025
Sweet Home Alabama, Lynyrd Skynyrd, 17.09.2025
Hit the Road Jack, Ray Charles, 24.09.2025
Mieć czy być, 03.10.2025
Rumble, Link Wray, 10.10.2025
Cigarettes, 17.10.2025
Hallelujah, Leonard Cohen, 28.10.2025
Lose Yourself, Eminem, 28.10.2025
1234, Feist, 28.10.2025
Knockin' on Heaven's Door, Bob Dylan, 28.10.2025
Superman, 07.11.2025
The Night We Met, Lord Huron, 14.11.2025
What's Up, 4 Non Blondes, 21.11.2025
Lulaj że Jezuniu, 28.11.2025
Come Together, The Beatles, 05.12.2025
Punishment, Mac DeMarco, 12.12.2025
Sto lat, 19.12.2025
Lili, Enej, 02.01.2026
You Really Got Me, The Kinks, 16.01.2026
Otherside, Red Hot Chili Peppers, 23.01.2026
Gdzie ta keja, 13.02.2026
Hurt, Johnny Cash, 06.03.2026
Whole Lotta Love, Led Zeppelin, 06.03.2026
Beat It, Michael Jackson, 13.03.2026
Day Tripper, The Beatles, 15.03.2026
Message in a Bottle, The Police, 30.03.2026
Edge of Desire, John Mayer, 30.03.2026
Money, Pink Floyd, 30.03.2026
Here Without You, 3 Doors Down, 11.04.2026
Kryptonite, 3 Doors Down, 11.04.2026
Traitor, Olivia Rodrigo, 24.04.2026
Kingdom of Cards, 24.04.2026
Ain't No Sunshine, Bill Withers, 24.04.2026
Obstacles, Syd Matters, 01.05.2026
Where Is My Mind, Pixies, 01.05.2026
I'll Be There for You, The Rembrandts, 08.05.2026
Babe I'm Gonna Leave You, Led Zeppelin, 15.05.2026
Sweet Child O' Mine, Guns N' Roses, 30.05.2026
Falling Slowly, Glen Hansard, 05.06.2026
Dust in the Wind, Kansas, 09.06.2026`;

// Remote = pointed at a Vercel deployment, OR explicitly running with real SMTP
// (local dev server configured to use remote Supabase, E2E_REAL_EMAIL=true).
const isRemote =
  (process.env.PLAYWRIGHT_BASE_URL ?? '').includes('vercel.app') ||
  process.env.E2E_REAL_EMAIL === 'true';

function adminClient() {
  // When running against preview/prod, use remote Supabase service role.
  // When running against localhost, use local Supabase.
  const url = isRemote
    ? (process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_REMOTE_URL ??
      'https://strummy-db.marszal-arts.online')
    : (process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL ?? 'http://192.168.1.75:54321');
  const key = isRemote
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_REMOTE_SERVICE_ROLE_KEY ?? '')
    : (process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

test.describe('Kuba Spiridono — manual onboarding', () => {
  test.setTimeout(180_000);

  test.beforeAll(async () => {
    const db = adminClient();

    // Clean up any Kuba profiles left from interrupted previous runs
    const { data } = await db
      .from('profiles')
      .select('id')
      .ilike('full_name', '%Kuba Spiridono%')
      .eq('is_shadow', true);
    if (data && data.length > 0) {
      const ids = data.map((r) => r.id);
      await db.from('profiles').delete().in('id', ids);
      console.log(`Cleaned up ${ids.length} existing Kuba shadow profile(s): ${ids.join(', ')}`);
    }

    // Delete any existing auth user for the invite email so inviteUserByEmail can
    // create a fresh invited account. This address may have been registered by a
    // prior test run or manual signup — without cleanup the invite fails with
    // "A user with this email address has already been registered".
    const { data: existingUser } = await db.auth.admin.listUsers();
    const target = existingUser?.users?.find((u) => u.email === INVITE_EMAIL);
    if (target) {
      await db.auth.admin.deleteUser(target.id);
      console.log(`Cleaned up existing auth user for ${INVITE_EMAIL}: ${target.id}`);
    }
  });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('create student → import 41 songs → send invite', async ({ page }, testInfo) => {
    // ── Step 1: Create shadow student ──────────────────────────────────────
    await page.goto('/dashboard/users/new');
    await page.waitForLoadState('networkidle');

    const form = page.locator('form');
    await form.locator('input').nth(0).fill('Kuba');
    await form.locator('input').nth(1).fill('Spiridono');
    await form.locator('input[type="email"]').fill(INVITE_EMAIL);

    await page.screenshot({ path: 'test-results/kuba-01-form-filled.png' });
    await form.locator('button[type="submit"]').click();

    await page.waitForURL(/\/dashboard\/users\/[0-9a-f-]{36}$/, { timeout: 20_000 });
    const studentId = page.url().split('/').pop()!;
    console.log('Created student ID:', studentId);
    testInfo.annotations.push({ type: 'Student ID', description: studentId });

    await page.screenshot({ path: 'test-results/kuba-02-student-created.png' });

    // ── Step 2: Import songs ───────────────────────────────────────────────
    await page.getByRole('link', { name: /Import songs/i }).click();
    await page.waitForURL(`/dashboard/users/${studentId}/import`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/kuba-03-import-page.png' });

    const textarea = page.locator('textarea');
    await textarea.fill(SONGS);

    // Wait for preview to render
    await expect(page.locator('text=Preview').first()).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('text=41 songs').or(page.locator('text=41 song')).first()
    ).toBeVisible({ timeout: 10_000 });

    await page.screenshot({ path: 'test-results/kuba-04-preview.png' });

    const importBtn = page.locator('button').filter({ hasText: /Import 41 song/i });
    await expect(importBtn).toBeVisible({ timeout: 5_000 });
    await importBtn.click();

    // Wait for import result summary (41 songs × fuzzy RPC may take >30 s on cold DB)
    await expect(
      page
        .locator('text=imported')
        .or(page.locator('text=created'))
        .or(page.locator('text=lessons'))
        .first()
    ).toBeVisible({ timeout: 60_000 });

    await page.screenshot({ path: 'test-results/kuba-05-import-result.png' });

    // ── Step 3: Send invite ────────────────────────────────────────────────
    // Clear Mailpit inbox so we can assert exactly one new email arrives.
    // Skip for remote runs (no local Mailpit available).
    if (!isRemote) await deleteAllMailpitMessages();

    await page.goto(`/dashboard/users/${studentId}`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/kuba-06-student-profile.png' });

    // InviteShadowButton: first click opens the email form ("Invite to claim")
    const openInviteBtn = page.getByRole('button', { name: /Invite to claim/i });
    await expect(openInviteBtn).toBeVisible({ timeout: 10_000 });
    await openInviteBtn.click();

    // Second click sends the invite ("Send" button appears next to email input)
    const sendBtn = page.getByRole('button', { name: /^Send$/i });
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await sendBtn.click();

    // After sending, the button area is replaced by "✓ Invite sent"
    await expect(page.locator('text=✓ Invite sent')).toBeVisible({ timeout: 15_000 });

    await page.screenshot({ path: 'test-results/kuba-07-invite-sent.png' });

    // ── Step 4: Assert email actually arrived ─────────────────────────────
    if (isRemote) {
      // Remote run: real SMTP → check the actual Gmail inbox.
      // Requires GMAIL_TEST_REFRESH_TOKEN in env (run scripts/setup-gmail-test-token.ts once).
      const email = await waitForGmailEmail(INVITE_EMAIL, "You've been invited to Strummy", 90_000);
      expect(email.subject).toBe("You've been invited to Strummy");
      expect(email.from).toContain('p.romanczuk@gmail.com');
      console.log(`  ✓ Email in Gmail: "${email.subject}" → ${INVITE_EMAIL}`);
    } else {
      // Local run: GoTrue → Mailpit (port 54324). Asserts delivery without real SMTP.
      // A silently-dropped email (template error, autoconfirm=true, rate limit) fails here.
      const email = await waitForEmail(INVITE_EMAIL, 15_000);
      expect(email.Subject).toBe("You've been invited to Strummy");
      expect(email.From.Address).toBe('p.romanczuk@gmail.com');
      console.log(`  ✓ Email in Mailpit: "${email.Subject}" → ${INVITE_EMAIL}`);
    }

    console.log(`✓ Kuba Spiridono onboarded. Student ID: ${studentId}`);
    console.log(`  Invite sent to: ${INVITE_EMAIL}`);
    console.log(`  Profile: http://localhost:3000/dashboard/users/${studentId}`);
  });
});
