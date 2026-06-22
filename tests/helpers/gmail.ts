/**
 * Gmail API helper for E2E tests.
 *
 * Used in remote runs (PLAYWRIGHT_BASE_URL=https://strummy-preview.vercel.app)
 * where real SMTP is used and emails land in the actual Gmail inbox.
 * Local runs use the Mailpit helper instead.
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID          — existing Google OAuth2 client ID
 *   GOOGLE_CLIENT_SECRET      — existing Google OAuth2 client secret
 *   GMAIL_TEST_REFRESH_TOKEN  — refresh token for romanczukpiotr95@gmail.com
 *                               (one-time setup: run scripts/setup-gmail-test-token.ts)
 *
 * Usage:
 *   const msg = await waitForGmailEmail('romanczukpiotr95@gmail.com', "You've been invited to Strummy");
 *   expect(msg.subject).toBe("You've been invited to Strummy");
 */

import { google, type gmail_v1 } from 'googleapis';

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
}

function buildOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_TEST_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Gmail test credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ' +
        'and GMAIL_TEST_REFRESH_TOKEN. Run scripts/setup-gmail-test-token.ts to get the refresh token.'
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[], name: string): string {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function decodeBody(part: gmail_v1.Schema$MessagePart): string {
  if (part.mimeType === 'text/html' && part.body?.data) {
    return Buffer.from(part.body.data, 'base64url').toString('utf-8');
  }
  if (part.parts) {
    for (const subPart of part.parts) {
      const result = decodeBody(subPart);
      if (result) return result;
    }
  }
  return '';
}

/**
 * Poll Gmail inbox until an email matching `subjectContains` appears,
 * then return it. Throws if nothing arrives within `timeoutMs`.
 *
 * Looks back `lookbackSeconds` to avoid picking up old emails.
 */
export async function waitForGmailEmail(
  toAddress: string,
  subjectContains: string,
  timeoutMs = 30_000
): Promise<GmailMessage> {
  const auth = buildOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  // Gmail search does not support Unix epoch timestamps — newer_than:1d covers any
  // realistic delivery delay and the subject+to filters keep results specific.
  const query = `to:${toAddress} subject:"${subjectContains}" newer_than:1d`;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const list = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 5,
    });

    const messages = list.data.messages ?? [];
    if (messages.length > 0) {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: messages[0].id!,
        format: 'full',
      });

      const headers = full.data.payload?.headers ?? [];
      return {
        id: full.data.id ?? '',
        subject: getHeader(headers, 'Subject'),
        from: getHeader(headers, 'From'),
        to: getHeader(headers, 'To'),
        date: getHeader(headers, 'Date'),
        snippet: full.data.snippet ?? '',
        body: decodeBody(full.data.payload ?? {}),
      };
    }

    await new Promise((r) => setTimeout(r, 2_000));
  }

  throw new Error(
    `No Gmail message to ${toAddress} with subject "${subjectContains}" ` +
      `arrived within ${timeoutMs}ms. Check inbox at gmail.com.`
  );
}
