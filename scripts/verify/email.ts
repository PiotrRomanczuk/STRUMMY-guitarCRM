import { createInterface } from 'node:readline/promises';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Reporter } from './lib/reporter';
import { createServiceClient } from './lib/supabase-clients';

type Options = { email: string; prod: boolean };

const MAILPIT_BASE =
  process.env.MAILPIT_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL?.replace(/:54321.*/, ':54324') ||
  'http://100.86.245.121:54324';

export async function runEmail(reporter: Reporter, opts: Options): Promise<void> {
  if (opts.prod) return runProd(reporter, opts.email);
  return runLocal(reporter, opts.email);
}

// ────────────────────────────────────────────────────────────────────────────
// Local mode — fully automated against Mailpit catcher on uwh
// ────────────────────────────────────────────────────────────────────────────

async function runLocal(reporter: Reporter, email: string): Promise<void> {
  reporter.section(`Email-delivery verifier (local/Mailpit) — ${email}`);
  reporter.info(`Mailpit: ${MAILPIT_BASE}`);
  const admin = createServiceClient();
  let userId: string | undefined;

  try {
    await reporter.step('clear Mailpit inbox', async () => {
      const res = await fetch(`${MAILPIT_BASE}/api/v1/messages`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Mailpit clear failed: HTTP ${res.status}`);
    });

    await reporter.step(`inviteUserByEmail(${email})`, async () => {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
      if (error) throw new Error(error.message);
      userId = data?.user?.id;
    });

    const messageId = await reporter.step('email lands in Mailpit (within 5s)', async () => {
      for (let i = 0; i < 25; i++) {
        const res = await fetch(
          `${MAILPIT_BASE}/api/v1/messages?query=${encodeURIComponent(`to:${email}`)}`
        );
        const json = (await res.json()) as { messages?: Array<{ ID: string }> };
        if (json.messages && json.messages.length > 0) return json.messages[0].ID;
        await new Promise((r) => setTimeout(r, 200));
      }
      throw new Error('Email did not arrive in Mailpit within 5s');
    });

    const link = await reporter.step('extract invite link from email body', async () => {
      if (!messageId) throw new Error('no messageId');
      const res = await fetch(`${MAILPIT_BASE}/api/v1/message/${messageId}`);
      const body = (await res.json()) as { HTML?: string; Text?: string; Subject?: string };
      const haystack = (body.HTML || body.Text || '').replace(/&amp;/g, '&');
      const match = haystack.match(/(https?:\/\/[^\s<>"]+\/auth\/v1\/verify[^\s<>"]*)/);
      if (!match) throw new Error(`No /auth/v1/verify link in email "${body.Subject}"`);
      return match[1];
    });

    await reporter.step(
      'invite link has expected shape (type=invite + hex token + redirect_to)',
      async () => {
        if (!link) throw new Error('no link');
        assertInviteLink(link);
      }
    );
  } finally {
    await reporter.step('cleanup (delete invited user + Mailpit messages)', async () => {
      const failures: string[] = [];
      if (userId) {
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) failures.push(`deleteUser: ${error.message}`);
      }
      const mp = await fetch(`${MAILPIT_BASE}/api/v1/messages`, { method: 'DELETE' });
      if (!mp.ok) failures.push(`Mailpit clear: HTTP ${mp.status}`);
      if (failures.length)
        throw new Error(`${failures.length} cleanup step(s) failed:\n  ${failures.join('\n  ')}`);
    });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Production mode — sends a real email; user pastes the link back for validation
// ────────────────────────────────────────────────────────────────────────────

async function runProd(reporter: Reporter, email: string): Promise<void> {
  reporter.section(`Email-delivery verifier (PROD) — ${email}`);
  reporter.info('WARNING: this sends a REAL invite email via production Supabase.');

  const admin = createProdServiceClient();
  let userId: string | undefined;

  try {
    await reporter.step(`PROD inviteUserByEmail(${email})`, async () => {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
      if (error) throw new Error(error.message);
      userId = data?.user?.id;
    });

    reporter.info(`→ Check ${email} now. The invite email should arrive within ~30s.`);
    const link = await promptForLink();

    if (!link) {
      reporter.info('No link pasted — skipping link validation.');
    } else {
      await reporter.step('pasted link has expected shape', async () => {
        assertInviteLink(link);
      });
    }
  } finally {
    await reporter.step('cleanup (delete invited PROD auth user)', async () => {
      if (!userId) return;
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw new Error(`deleteUser(${userId}): ${error.message}`);
    });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function assertInviteLink(link: string): void {
  const url = new URL(link);
  if (!url.pathname.endsWith('/auth/v1/verify')) {
    throw new Error(`Unexpected pathname: ${url.pathname} (want /auth/v1/verify)`);
  }
  const type = url.searchParams.get('type');
  const token = url.searchParams.get('token');
  const redirect = url.searchParams.get('redirect_to');
  if (type !== 'invite') throw new Error(`type=${type} (want invite)`);
  if (!token || !/^[0-9a-f]{40,}$/.test(token)) {
    throw new Error(`token missing or not hex (saw: ${(token ?? '').slice(0, 20)}…)`);
  }
  if (!redirect) throw new Error('redirect_to missing from invite link');
}

function createProdServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('PROD mode needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  }
  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    throw new Error(`Refusing PROD mode against ${url} — looks local. Aborting.`);
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function promptForLink(): Promise<string | null> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(
      'Paste the magic link from the email (or press Enter to skip): '
    );
    return answer.trim() || null;
  } finally {
    rl.close();
  }
}
