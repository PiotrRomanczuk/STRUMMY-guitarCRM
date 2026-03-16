import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const CAPTURE_SCRIPT_URL = 'https://mcp.figma.com/mcp/html-to-design/capture.js';

const jobs = [
  { page: '/dashboard/lessons', name: 'Student Lessons', captureId: '537d3fa7-ca48-4c3e-8d83-4e2cf6c22a9e' },
  { page: '/dashboard/assignments', name: 'Student Assignments', captureId: 'f2cae3bf-74ed-42e0-b214-6469392722c8' },
  { page: '/dashboard/repertoire', name: 'Student Repertoire', captureId: 'd1cec9e3-b1fa-47d3-820f-cd4cda3ff1fa' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });

  // Download capture script once
  const context0 = await browser.newContext();
  const scriptResp = await context0.request.get(CAPTURE_SCRIPT_URL);
  const captureScript = await scriptResp.text();
  await context0.close();
  console.log(`Capture script downloaded (${captureScript.length} bytes)`);

  for (const job of jobs) {
    console.log(`\n=== ${job.name} ===`);

    // Fresh context per page to avoid navigation issues
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();

    // Login
    await page.goto(`${BASE_URL}/sign-in`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"], input[name="email"]', 'student@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'test123_student');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Set v2 cookie
    await context.addCookies([{
      name: 'strummy-ui-version', value: 'v2', domain: 'localhost', path: '/',
    }]);

    // Navigate to target page
    await page.goto(`${BASE_URL}${job.page}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Inject capture script
    await page.evaluate((s) => {
      const el = document.createElement('script');
      el.textContent = s;
      document.head.appendChild(el);
    }, captureScript);
    await page.waitForTimeout(1000);

    // Trigger capture with timeout
    const endpoint = `https://mcp.figma.com/mcp/capture/${job.captureId}/submit`;
    try {
      await Promise.race([
        page.evaluate(
          (opts) => (window as unknown as { figma: { captureForDesign: (o: { captureId: string; endpoint: string; selector: string }) => Promise<unknown> } }).figma.captureForDesign({
            captureId: opts.captureId,
            endpoint: opts.endpoint,
            selector: 'body',
          }),
          { captureId: job.captureId, endpoint }
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
      ]);
      console.log(`  Done (resolved)`);
    } catch (_err) {
      console.log(`  Submitted (promise didn't resolve, but capture was likely sent)`);
    }

    await page.waitForTimeout(3000);
    await context.close();
  }

  await browser.close();
  console.log('\nAll done!');
}

main().catch(console.error);
