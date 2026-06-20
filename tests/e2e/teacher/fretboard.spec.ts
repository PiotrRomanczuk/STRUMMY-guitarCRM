import { test, expect } from '../../fixtures';

/**
 * Fretboard Explorer E2E Tests
 *
 * Covers the interactive fretboard at /dashboard/fretboard:
 *  - key selector + sharp/flat relabeling
 *  - scale overlays and chord-tone overlays
 *  - display toggles (intervals, hide non-scale, highlight root)
 *  - click-to-identify a note
 *  - shareable URL state (read + write)
 *  - info panel note chips
 *
 * Cell positions are deterministic from music theory. The high-E string is
 * row 0; on it the note at fret f is CHROMATIC[(4 + f) % 12]. Examples used:
 *   row0/fret5  → A,  row0/fret8 → C,  row0/fret9 → C#,  row0/fret10 → D
 */

test.describe('Fretboard Explorer', { tag: ['@teacher', '@fretboard'] }, () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ loginAs, page }) => {
    // Serial mode prevents parallel dev-server overload; generous timeout for
    // first-compile + auth roundtrip under the full parallel suite.
    test.setTimeout(90_000);
    await loginAs('admin');
    await page.goto('/dashboard/fretboard');
    await expect(page.locator('[data-testid="fb-board"]')).toBeVisible({ timeout: 45_000 });
  });

  test('loads with the default A pentatonic minor view and a root highlight', async ({ page }) => {
    await expect(page.locator('[data-testid="fb-title"]')).toContainText('Pentatonic Minor');
    const rootCell = page.locator('[data-testid="fb-cell-0-5"]');
    await expect(rootCell).toHaveAttribute('data-note', 'A');
    await expect(rootCell).toHaveAttribute('data-root', 'true');
    await expect(rootCell).toHaveAttribute('data-active', 'true');
    // 6 strings × 12 frets = 72 interactive cells.
    await expect(page.locator('[data-testid^="fb-cell-"]')).toHaveCount(72);
  });

  test('changing the key moves the root and overlay', async ({ page }) => {
    await page.locator('[data-testid="fb-key-C"]').click();
    // C pentatonic minor: root C sits at high-E fret 8.
    const cRoot = page.locator('[data-testid="fb-cell-0-8"]');
    await expect(cRoot).toHaveAttribute('data-note', 'C');
    await expect(cRoot).toHaveAttribute('data-root', 'true');
    await expect(cRoot).toHaveAttribute('data-active', 'true');
    // The former A root is no longer the root.
    await expect(page.locator('[data-testid="fb-cell-0-5"]')).toHaveAttribute('data-root', 'false');
  });

  test('sharp/flat toggle relabels notes', async ({ page }) => {
    const cSharpKey = page.locator('[data-testid="fb-key-C#"]');
    await expect(cSharpKey).toHaveText('C#');
    await page.locator('[data-testid="fb-accidental-flat"]').click();
    await expect(cSharpKey).toHaveText('Db');
    // A C# cell on the board is relabeled too (note attribute stays canonical).
    const cSharpCell = page.locator('[data-testid="fb-cell-0-9"]');
    await expect(cSharpCell).toHaveAttribute('data-note', 'C#');
    await expect(cSharpCell).toHaveText('Db');
  });

  test('scale overlay reflects the selected scale', async ({ page }) => {
    await page.locator('[data-testid="fb-scale-select"]').selectOption('major');
    // C is not the key yet (key is A). Switch to C major for an easy check.
    await page.locator('[data-testid="fb-key-C"]').click();
    // C major contains E (in scale) but not C# (out of scale).
    await expect(page.locator('[data-testid="fb-cell-0-8"]')).toHaveAttribute(
      'data-active',
      'true'
    ); // C
    await expect(page.locator('[data-testid="fb-cell-0-9"]')).toHaveAttribute(
      'data-active',
      'false'
    ); // C#
    await expect(page.locator('[data-testid="fb-note-chip"]')).toHaveCount(7);
  });

  test('chord mode highlights chord tones', async ({ page }) => {
    await page.locator('[data-testid="fb-mode-chord"]').click();
    await page.locator('[data-testid="fb-chord-select"]').selectOption('minor');
    // Key is still A → A minor chord = A, C, E.
    await expect(page.locator('[data-testid="fb-cell-0-5"]')).toHaveAttribute(
      'data-active',
      'true'
    ); // A
    await expect(page.locator('[data-testid="fb-cell-0-8"]')).toHaveAttribute(
      'data-active',
      'true'
    ); // C
    await expect(page.locator('[data-testid="fb-cell-0-10"]')).toHaveAttribute(
      'data-active',
      'false'
    ); // D
    await expect(page.locator('[data-testid="fb-note-chip"]')).toHaveCount(3);
  });

  test('show-intervals toggle swaps note names for interval names', async ({ page }) => {
    const rootCell = page.locator('[data-testid="fb-cell-0-5"]');
    await expect(rootCell).toHaveText('A');
    await page.locator('[data-testid="fb-toggle-intervals"]').click();
    await expect(rootCell).toHaveText('R');
  });

  test('hide-non-scale toggle hides notes outside the scale', async ({ page }) => {
    const offScale = page.locator('[data-testid="fb-cell-0-1"]'); // F, not in A pent minor
    await expect(offScale).toHaveAttribute('data-hidden', 'false');
    await page.locator('[data-testid="fb-toggle-hide-nonscale"]').click();
    await expect(offScale).toHaveAttribute('data-hidden', 'true');
    // In-scale notes remain visible.
    await expect(page.locator('[data-testid="fb-cell-0-5"]')).toHaveAttribute(
      'data-hidden',
      'false'
    );
  });

  test('clicking a fret identifies the note', async ({ page }) => {
    await expect(page.locator('[data-testid="fb-tapped"]')).toContainText('Tap a note');
    await page.locator('[data-testid="fb-cell-0-5"]').click();
    const tapped = page.locator('[data-testid="fb-tapped"]');
    await expect(tapped).toContainText('A');
    await expect(tapped).toContainText('string 1');
    await expect(tapped).toContainText('fret 5');
  });

  test('selections are written to the URL', async ({ page }) => {
    await page.locator('[data-testid="fb-key-C"]').click();
    await page.locator('[data-testid="fb-scale-select"]').selectOption('major');
    await expect(page).toHaveURL(/key=C/);
    await expect(page).toHaveURL(/scale=major/);
  });

  test('a shared URL restores the view', async ({ page }) => {
    await page.goto('/dashboard/fretboard?key=C&mode=scale&scale=major');
    await expect(page.locator('[data-testid="fb-board"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-testid="fb-title"]')).toContainText('C');
    await expect(page.locator('[data-testid="fb-title"]')).toContainText('Major');
    await expect(page.locator('[data-testid="fb-scale-select"]')).toHaveValue('major');
    await expect(page.locator('[data-testid="fb-cell-0-8"]')).toHaveAttribute('data-root', 'true');
  });
});
