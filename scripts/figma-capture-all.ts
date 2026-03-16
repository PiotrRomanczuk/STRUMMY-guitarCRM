import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const CAPTURE_SCRIPT_URL = 'https://mcp.figma.com/mcp/html-to-design/capture.js';

// Pass capture IDs as JSON file argument
// Usage: npx tsx scripts/figma-capture-all.ts captures.json
const capturesFile = process.argv[2];
if (!capturesFile) {
  console.error('Usage: npx tsx scripts/figma-capture-all.ts <captures.json>');
  console.error('JSON format: [{ "page": "/dashboard", "captureId": "xxx", "endpoint": "https://..." }]');
  process.exit(1);
}

interface CaptureJob {
  page: string;
  name: string;
  captureId: string;
}

const jobs: CaptureJob[] = JSON.parse(fs.readFileSync(capturesFile, 'utf-8'));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  // Download capture script once
  console.log('Downloading Figma capture script...');
  const scriptResp = await context.request.get(CAPTURE_SCRIPT_URL);
  const captureScript = await scriptResp.text();
  console.log(`Script downloaded (${captureScript.length} bytes)`);

  // Login as student
  console.log('Logging in as student...');
  await page.goto(`${BASE_URL}/sign-in`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"], input[name="email"]', 'student@example.com');
  await page.fill('input[type="password"], input[name="password"]', 'test123_student');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  console.log('Logged in!');

  // Set v2 cookie
  await context.addCookies([{
    name: 'strummy-ui-version',
    value: 'v2',
    domain: 'localhost',
    path: '/',
  }]);

  for (const job of jobs) {
    console.log(`\nCapturing ${job.name} (${job.page})...`);
    const endpoint = `https://mcp.figma.com/mcp/capture/${job.captureId}/submit`;

    // Navigate
    await page.goto(`${BASE_URL}${job.page}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000); // Let data load

    // Inject capture script
    await page.evaluate((s) => {
      const el = document.createElement('script');
      el.textContent = s;
      document.head.appendChild(el);
    }, captureScript);
    await page.waitForTimeout(1000); // Let script initialize

    // Trigger capture
    try {
      const result = await page.evaluate(
        (opts: { captureId: string; endpoint: string }) => {
          return (window as unknown as Record<string, unknown> & { figma: { captureForDesign: (opts: { captureId: string; endpoint: string; selector: string }) => Promise<unknown> } }).figma.captureForDesign({
            captureId: opts.captureId,
            endpoint: opts.endpoint,
            selector: 'body',
          });
        },
        { captureId: job.captureId, endpoint }
      );
      console.log(`  ✓ ${job.name} captured:`, JSON.stringify(result));
    } catch (err) {
      console.error(`  ✗ ${job.name} failed:`, (err as Error).message);
    }

    await page.waitForTimeout(2000); // Let upload complete
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch(console.error);
