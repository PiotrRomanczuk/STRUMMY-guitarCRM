import { test, expect } from '@playwright/test';

/**
 * Landing Page Content Smoke Tests
 *
 * `smoke/critical-path.spec.ts` only asserts generic things about `/` (body
 * visible, lang attribute, known nav hrefs, no overflow, no console errors).
 * These tests assert the actual marketing content — hero copy, primary CTAs,
 * and the section shells (Capabilities, Pricing, FAQ, Final CTA) — so a
 * regression in `components/landing/*` fails a spec that names it, not just
 * "some link disappeared".
 */
test.describe('Landing Page Content', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ page }) => {
    // These assertions target desktop presentation specifically (nav links,
    // section layout) — force a desktop viewport regardless of which
    // Playwright project (including the mobile device profiles) runs this.
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
  });

  test('hero renders the headline, subheadline, and primary CTAs', async ({ page }) => {
    // Scope to the hero <section> — "Start free" also appears in the header
    // and final CTA, so an unscoped locator would match the wrong link.
    const hero = page.locator('section').filter({ has: page.getByRole('heading', { level: 1 }) });

    await expect(
      hero.getByRole('heading', {
        name: 'Stop juggling spreadsheets and start teaching',
        level: 1,
      })
    ).toBeVisible();

    await expect(hero.getByText(/Strummy brings your entire studio into one place/i)).toBeVisible();

    await expect(hero.getByRole('link', { name: 'Start free' })).toHaveAttribute(
      'href',
      '/sign-up'
    );
    await expect(hero.getByRole('link', { name: 'Try the live demo' })).toHaveAttribute(
      'href',
      '/sign-in?demo=true'
    );
  });

  test('header nav links to marketing sections and auth CTAs are correct', async ({ page }) => {
    // Scope to the <header> element directly (not getByRole('banner') — the
    // root layout nests the whole page inside an outer <main>, which strips
    // <header>'s implicit "banner" role per the HTML spec). The footer also
    // repeats "Features", "Pricing", and "Sign in" with the same hrefs, which
    // would otherwise make these locators match 2 elements each (strict-mode
    // violation).
    const header = page.locator('header');

    await expect(header.getByRole('link', { name: 'Features' })).toHaveAttribute(
      'href',
      '/#capabilities'
    );
    await expect(header.getByRole('link', { name: 'Pricing' })).toHaveAttribute(
      'href',
      '/#pricing'
    );
    await expect(header.getByRole('link', { name: 'Teachers' })).toHaveAttribute(
      'href',
      '/#reality'
    );
    await expect(header.getByRole('link', { name: 'Resources' })).toHaveAttribute('href', '/#faq');

    await expect(header.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in');
  });

  test('capabilities section lists what the product does', async ({ page }) => {
    const section = page.locator('#capabilities');
    await expect(
      section.getByRole('heading', { name: 'Everything you need to run your studio' })
    ).toBeVisible();

    await expect(section.getByText('Students and songs')).toBeVisible();
    await expect(section.getByText('Lessons and planning')).toBeVisible();
    await expect(section.getByText('Sharing with students and parents')).toBeVisible();
  });

  test('pricing section shows all three tiers with working CTAs', async ({ page }) => {
    const section = page.locator('#pricing');
    await expect(section.getByRole('heading', { name: 'Pricing', level: 2 })).toBeVisible();

    // exact: true — the Pro tier's feature list includes "Everything in
    // Starter", which would otherwise also match this locator.
    await expect(section.getByText('Starter', { exact: true })).toBeVisible();
    await expect(section.getByText('Free', { exact: true })).toBeVisible();
    await expect(section.getByText('Pro', { exact: true })).toBeVisible();
    await expect(section.getByText('$19')).toBeVisible();
    await expect(section.getByText('Studio', { exact: true })).toBeVisible();
    await expect(section.getByText('$39')).toBeVisible();

    // Starter tier CTA sends free sign-ups straight to the app.
    await expect(section.getByRole('link', { name: 'Start now' })).toHaveAttribute(
      'href',
      '/sign-up'
    );
    // Pro/Studio tiers aren't billed yet, so both CTAs route to the demo.
    const demoLinks = section.getByRole('link', { name: 'Try the demo' });
    await expect(demoLinks).toHaveCount(2);
    for (const link of await demoLinks.all()) {
      await expect(link).toHaveAttribute('href', '/sign-in?demo=true');
    }
  });

  test('FAQ section renders real questions and a demo CTA', async ({ page }) => {
    const section = page.locator('#faq');
    await expect(section.getByRole('heading', { name: 'Questions', level: 2 })).toBeVisible();
    await expect(section.getByText('Is my student data private?')).toBeVisible();
    await expect(section.getByText('Can I import my existing notes?')).toBeVisible();

    await expect(section.getByRole('link', { name: 'Try the live demo' })).toHaveAttribute(
      'href',
      '/sign-in?demo=true'
    );
  });

  test('final CTA section renders with heading and sign-up/demo links', async ({ page }) => {
    // Scope to the final-CTA <section> via its heading — it has no id, and
    // "Start free" / "Try the live demo" also appear in the header/hero/FAQ.
    const finalCta = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Start teaching, not managing', level: 2 }),
    });

    await expect(
      finalCta.getByRole('heading', { name: 'Start teaching, not managing', level: 2 })
    ).toBeVisible();

    await expect(finalCta.getByRole('link', { name: 'Start free' })).toHaveAttribute(
      'href',
      '/sign-up'
    );
    await expect(finalCta.getByRole('link', { name: 'Try the live demo' })).toHaveAttribute(
      'href',
      '/sign-in?demo=true'
    );
  });
});
