import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { google } from 'googleapis';

const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GMAIL_TEST_REFRESH_TOKEN });
const gmail = google.gmail({ version: 'v1', auth });

(async () => {
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: `subject:"invited to Strummy" in:anywhere`,
    maxResults: 10,
  });
  const msgs = res.data.messages ?? [];
  console.log(`\nromanczukpiotr95@gmail.com — all Strummy emails: ${msgs.length}`);
  for (const m of msgs) {
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: m.id!,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Date'],
    });
    const h = full.data.payload?.headers ?? [];
    const get = (name: string) => h.find((x) => x.name === name)?.value ?? '';
    console.log(`  ${get('Date')}`);
    console.log(`  From: ${get('From')}`);
    console.log(`  Subject: ${get('Subject')}\n`);
  }
})().catch((e) => console.error('Error:', e.message));
