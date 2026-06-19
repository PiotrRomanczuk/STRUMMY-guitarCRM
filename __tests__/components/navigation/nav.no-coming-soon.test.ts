/**
 * nav.no-coming-soon.test — Verifies that no navigation link in AppSidebar
 * points to a Coming-soon placeholder route.
 *
 * Decision D-10: the standalone /dashboard/content/* route tree has been
 * removed. This test fails if someone re-adds a nav entry to those paths.
 */

// The routes that must NOT appear in any nav config.
const COMING_SOON_PATHS = [
  '/dashboard/content',
  '/dashboard/content/calendar',
  '/dashboard/content/hashtags',
];

describe('nav.no-coming-soon', () => {
  it('AppSidebar has no link to /dashboard/content/* (decision D-10)', async () => {
    // Import the raw source text to catch paths without rendering the component.
    // This guards against import-time errors from the mocked environment too.
    const fs = await import('fs');
    const path = await import('path');
    const sidebarPath = path.resolve(__dirname, '../../../components/navigation/AppSidebar.tsx');
    const src = fs.readFileSync(sidebarPath, 'utf-8');

    for (const route of COMING_SOON_PATHS) {
      expect(src).not.toContain(`'${route}'`);
      expect(src).not.toContain(`"${route}"`);
    }
  });

  it('AppSidebar does not import Clapperboard (removed with content entry)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const sidebarPath = path.resolve(__dirname, '../../../components/navigation/AppSidebar.tsx');
    const src = fs.readFileSync(sidebarPath, 'utf-8');
    expect(src).not.toContain('Clapperboard');
  });

  it('the /dashboard/content route files have been deleted', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const contentDir = path.resolve(__dirname, '../../../app/dashboard/content');
    expect(fs.existsSync(contentDir)).toBe(false);
  });
});
