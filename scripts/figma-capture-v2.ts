import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const CAPTURE_ID = process.argv[2];
const ENDPOINT = `https://mcp.figma.com/mcp/capture/${CAPTURE_ID}/submit`;

if (!CAPTURE_ID) {
  console.error('Usage: npx tsx scripts/figma-capture-v2.ts <captureId>');
  process.exit(1);
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

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

  // Set mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });

  // Navigate to dashboard with capture hash
  const url = `${BASE_URL}/dashboard#figmacapture=${CAPTURE_ID}&figmaendpoint=${encodeURIComponent(ENDPOINT)}&figmadelay=5000`;
  console.log('Opening dashboard with Figma capture...');
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');

  // Inject the capture script
  const scriptResp = await page.context().request.get('https://mcp.figma.com/mcp/html-to-design/capture.js');
  const scriptText = await scriptResp.text();
  await page.evaluate((s) => {
    const el = document.createElement('script');
    el.textContent = s;
    document.head.appendChild(el);
  }, scriptText);

  // Wait for page to fully render
  await page.waitForTimeout(6000);

  // Trigger capture
  console.log('Triggering Figma capture...');
  const result = await page.evaluate((opts) => {
    return (window as unknown as { figma: { captureForDesign: (o: { captureId: string; endpoint: string; selector: string }) => Promise<unknown> } }).figma.captureForDesign({
      captureId: opts.captureId,
      endpoint: opts.endpoint,
      selector: 'body',
    });
  }, { captureId: CAPTURE_ID, endpoint: ENDPOINT });

  console.log('Capture result:', JSON.stringify(result));
  await page.waitForTimeout(3000);
  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
