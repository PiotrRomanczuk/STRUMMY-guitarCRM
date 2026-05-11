/**
 * Third-party stub helpers for Playwright.
 *
 * Each function attaches `page.route(...)` interceptors that short-circuit a
 * remote service with a deterministic local response. Specs opt in per-file
 * so a "real" integration test can still exist alongside stubbed UI tests.
 *
 * The contract: a stub MUST not let the request reach the network. If a
 * route is missing in the stub, the call falls through; specs should treat
 * a real outbound call as a test failure (use `stubAssertNoNetwork` below).
 */

import type { Page, Route } from '@playwright/test';

type Json = Record<string, unknown> | unknown[];

function respondJson(route: Route, body: Json, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/**
 * Pretend the Google OAuth exchange-code flow succeeded. The Strummy callback
 * (`/auth/callback`) calls `supabase.auth.exchangeCodeForSession` internally,
 * which talks to the local Supabase, not Google — so this stub mostly covers
 * the calendar API; the auth callback runs against local Supabase as usual.
 */
export async function stubGoogleOAuth(page: Page): Promise<void> {
  await page.route('https://oauth2.googleapis.com/**', (route) =>
    respondJson(route, {
      access_token: 'e2e-google-access-token',
      refresh_token: 'e2e-google-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
    })
  );
}

export async function stubGoogleCalendar(
  page: Page,
  events: Array<{ id: string; summary: string; start: { dateTime: string } }>
): Promise<void> {
  await page.route('https://www.googleapis.com/calendar/v3/**', (route) => {
    const url = route.request().url();
    if (url.includes('/events')) {
      return respondJson(route, { items: events, nextPageToken: null });
    }
    return respondJson(route, {});
  });
}

export async function stubSpotify(
  page: Page,
  fixtures: {
    search?: Array<{ id: string; name: string; artists: { name: string }[] }>;
    audioFeatures?: Record<string, { tempo: number; key: number }>;
  } = {}
): Promise<void> {
  await page.route('https://api.spotify.com/v1/**', (route) => {
    const url = route.request().url();
    if (url.includes('/search')) {
      return respondJson(route, { tracks: { items: fixtures.search ?? [] } });
    }
    if (url.includes('/audio-features')) {
      return respondJson(route, { audio_features: fixtures.audioFeatures ?? {} });
    }
    return respondJson(route, {});
  });
}

/**
 * Stub the AI provider used by `lib/ai`. Returns a fixed text/JSON response so
 * specs are deterministic. Specs that need failure cases pass `errorStatus`.
 */
export async function stubAI(
  page: Page,
  response: { content?: string; errorStatus?: number } = {}
): Promise<void> {
  await page.route(
    /openrouter\.ai|api\.openai\.com|api\.anthropic\.com|localhost:11434/,
    (route) => {
      if (response.errorStatus) {
        return route.fulfill({
          status: response.errorStatus,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'stubbed error' } }),
        });
      }
      return respondJson(route, {
        choices: [
          {
            message: { role: 'assistant', content: response.content ?? '{"ok":true}' },
          },
        ],
      });
    }
  );
}

interface CapturedEmail {
  to: string;
  subject?: string;
  body: string;
  url: string;
}

/**
 * Capture outbound email sends so password-reset / verify-email specs can read
 * the link without a real inbox. Returns an array that the caller can poll.
 *
 * Strummy's mail send paths the suite cares about today:
 *   - Supabase Auth emails (signup, recovery) — these hit
 *     /auth/v1/admin/generate_link on the Supabase URL. We capture both
 *     `recovery` and `signup` types.
 *   - In-app notification emails — `/api/email/**` on the dev server.
 */
export async function stubMailInbox(page: Page): Promise<CapturedEmail[]> {
  const inbox: CapturedEmail[] = [];

  await page.route(/\/auth\/v1\/admin\/generate_link/, async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}');
    const url = `http://localhost:3000/auth/callback?type=${body.type ?? 'recovery'}&token=e2e-token`;
    inbox.push({
      to: body.email ?? '',
      subject: `Auth: ${body.type ?? 'recovery'}`,
      body: `Click here: ${url}`,
      url,
    });
    return respondJson(route, { action_link: url });
  });

  await page.route('**/api/email/**', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}');
    inbox.push({
      to: body.to ?? '',
      subject: body.subject,
      body: body.html ?? body.text ?? '',
      url: body.url ?? '',
    });
    return respondJson(route, { sent: true });
  });

  return inbox;
}

/**
 * Hard assertion: any request to a real third-party domain during this spec
 * is a failure. Useful when a stub setup was assumed but the test accidentally
 * hits the network.
 */
export async function stubAssertNoNetwork(page: Page): Promise<void> {
  const FORBIDDEN = [
    /googleapis\.com/,
    /accounts\.google\.com/,
    /api\.spotify\.com/,
    /openrouter\.ai/,
    /api\.openai\.com/,
    /api\.anthropic\.com/,
  ];
  page.on('request', (req) => {
    const url = req.url();
    for (const re of FORBIDDEN) {
      if (re.test(url)) {
        throw new Error(`[stubAssertNoNetwork] forbidden outbound request: ${url}`);
      }
    }
  });
}
