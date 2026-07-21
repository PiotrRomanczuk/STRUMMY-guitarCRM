import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';
import { getTeacherId } from '../../helpers/seed-ids';

/**
 * Teacher Assignment Templates — round-trip E2E.
 *
 * Proves the full loop the unit layer can't: a teacher authors a template, it
 * lands in the list, and a new assignment started from it inherits the
 * template's title and checklist.
 *
 * Editorial routes:
 *  - `/dashboard/assignments/templates`        — list + "+ New template"
 *  - `/dashboard/assignments/templates/new`    — TemplateEditEditorial (create)
 *      `#template-title`, `#template-brief`, ChecklistEditor ("+ Add checklist item",
 *      inputs aria-labelled "Checklist item N"), submit "Create template"
 *  - `/dashboard/assignments/new`              — AssignmentCreateEditorial
 *      `<select id="assignment-template">` (TemplatePicker) prefills the form
 */

let TEACHER_ID = '';
const SEEDED_TEMPLATE_TITLE = 'E2E Seeded Template';
const SEEDED_ITEM = 'Seeded step — tune to E';
const UI_TEMPLATE_TITLE = `E2E UI Template ${Date.now()}`;
const FROM_TEMPLATE_ASSIGNMENT = `${SEEDED_TEMPLATE_TITLE}`; // title is inherited from the template

function adminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

let seededTemplateId: string | null = null;

test.describe('Teacher Assignment Templates', { tag: ['@teacher', '@assignments'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();
    TEACHER_ID = await getTeacherId(db);

    // Clean any leftovers from a prior run so titles are unambiguous.
    await db
      .from('assignment_templates')
      .delete()
      .eq('teacher_id', TEACHER_ID)
      .in('title', [SEEDED_TEMPLATE_TITLE, UI_TEMPLATE_TITLE]);
    await db
      .from('assignments')
      .delete()
      .eq('teacher_id', TEACHER_ID)
      .eq('title', FROM_TEMPLATE_ASSIGNMENT);

    const { data } = await db
      .from('assignment_templates')
      .insert({
        teacher_id: TEACHER_ID,
        title: SEEDED_TEMPLATE_TITLE,
        description: 'Seeded by the templates round-trip spec.',
        checklist: [{ id: 'seed-1', text: SEEDED_ITEM, done: false }],
      })
      .select('id')
      .single();
    seededTemplateId = data?.id ?? null;
  });

  test.afterAll(async () => {
    const db = adminClient();
    await db
      .from('assignment_templates')
      .delete()
      .eq('teacher_id', TEACHER_ID)
      .in('title', [SEEDED_TEMPLATE_TITLE, UI_TEMPLATE_TITLE]);
    await db
      .from('assignments')
      .delete()
      .eq('teacher_id', TEACHER_ID)
      .eq('title', FROM_TEMPLATE_ASSIGNMENT);
  });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('templates list shows seeded template and a New-template affordance', async ({ page }) => {
    test.skip(!seededTemplateId, 'Template failed to seed');

    await page.goto('/dashboard/assignments/templates');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /templates/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(SEEDED_TEMPLATE_TITLE, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('link', { name: /new template/i })).toBeVisible();
  });

  test('creates a template through the UI and it lands in the list', async ({ page }) => {
    await page.goto('/dashboard/assignments/templates/new');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#template-title')).toBeVisible({ timeout: 15_000 });
    await page.locator('#template-title').fill(UI_TEMPLATE_TITLE);

    // Author one checklist item.
    await page.getByRole('button', { name: /add checklist item/i }).click();
    await page.getByLabel('Checklist item 1').fill('Warm up for five minutes');

    await page.getByRole('button', { name: /^create template$/i }).click();

    // On success the form router.push()es back to the list.
    await expect(page).toHaveURL(/\/dashboard\/assignments\/templates$/, { timeout: 15_000 });
    await expect(page.getByText(UI_TEMPLATE_TITLE, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('starts a new assignment from a template, inheriting title + checklist', async ({
    page,
  }) => {
    test.skip(!seededTemplateId, 'Template failed to seed');

    await page.goto('/dashboard/assignments/new');
    await page.waitForLoadState('networkidle');

    // The TemplatePicker only renders when the teacher has ≥1 template — the
    // seed guarantees it.
    const picker = page.locator('#assignment-template');
    await expect(picker).toBeVisible({ timeout: 15_000 });

    await picker.selectOption({ label: SEEDED_TEMPLATE_TITLE });

    // Applying the template prefills the title.
    await expect(page.locator('#assignment-title')).toHaveValue(SEEDED_TEMPLATE_TITLE, {
      timeout: 10_000,
    });

    // A student is required — pick the first real option.
    await page.locator('#assignment-student').selectOption({ index: 1 });

    await page.getByRole('button', { name: /^create assignment$/i }).click();

    // Success routes to the new assignment's detail page.
    await expect(page).toHaveURL(/\/dashboard\/assignments\/[a-zA-Z0-9-]+$/, { timeout: 20_000 });

    // The inherited checklist renders in the Progress card.
    await expect(page.getByText(SEEDED_ITEM, { exact: true })).toBeVisible({ timeout: 20_000 });
  });
});
