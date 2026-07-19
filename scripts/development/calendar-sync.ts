#!/usr/bin/env tsx

/**
 * On-demand Google Calendar → lessons inbound sync (dev trigger).
 *
 * Google push webhooks need a public HTTPS endpoint, so they never fire against
 * localhost. This script runs the same admin-side import the webhook would
 * (`fetchAndSyncRecentEvents`), so you can exercise inbound sync locally without
 * a tunnel. See docs/app-blueprint/reference/GOOGLE_AUTH_DEV.md.
 *
 * Usage:
 *   npm run dev:calendar-sync                       # default teacher, local Supabase
 *   npm run dev:calendar-sync -- you@example.com    # specific teacher by email
 *   npm run dev:calendar-sync -- --remote           # target REMOTE Supabase
 *
 * The teacher must already have a Google integration row in the TARGET database
 * (connect via /api/auth/google while pointed at that Supabase first).
 *
 * Local-host note (CLAUDE.md): if Node fetch can't reach the LAN Supabase IP,
 * override the URL at invocation, e.g.
 *   NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://100.86.245.121:54321 npm run dev:calendar-sync
 */

import { config } from 'dotenv';
import { join } from 'path';

// dotenv does not override already-set process.env, so invocation-time overrides win.
config({ path: join(process.cwd(), '.env.local') });

const DEFAULT_TEACHER_EMAIL = 'p.romanczuk@gmail.com';

async function main() {
  const args = process.argv.slice(2);
  const forceRemote = args.includes('--remote');
  const email = args.find((a) => a.includes('@')) ?? DEFAULT_TEACHER_EMAIL;

  // Imported after dotenv so env is populated when these modules read it.
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const { fetchAndSyncRecentEvents } = await import('@/lib/services/google-calendar-sync');

  const admin = createAdminClient({ forceRemote });
  const target = forceRemote ? 'REMOTE' : 'LOCAL';
  console.log(`\n📅 Calendar sync → ${target} Supabase, teacher: ${email}`);

  const { data: profile, error } = await admin
    .from('profiles')
    .select('user_id, full_name')
    .eq('email', email)
    .not('user_id', 'is', null)
    .single();

  if (error || !profile?.user_id) {
    console.error(`❌ No profile with a linked auth user for ${email}.`, error?.message ?? '');
    process.exit(1);
  }

  const { data: integration } = await admin
    .from('user_integrations')
    .select('user_id, expires_at')
    .eq('user_id', profile.user_id)
    .eq('provider', 'google')
    .maybeSingle();

  if (!integration) {
    console.error(
      `❌ ${email} has no Google integration in ${target} Supabase.\n` +
        `   Connect via /api/auth/google while pointed at ${target} first.`
    );
    process.exit(1);
  }

  const expired = integration.expires_at ? integration.expires_at < Date.now() : false;
  console.log(
    `   Google connected (access token ${expired ? 'expired — will refresh' : 'valid'}).`
  );

  const result = await fetchAndSyncRecentEvents(profile.user_id);

  if (!result.success) {
    console.error(`❌ Sync failed: ${result.error}`);
    process.exit(1);
  }

  console.log(`✅ Imported ${result.count} lesson(s).`);
  if (result.details) {
    const skipped = result.details.results.filter((r) => !r.success);
    if (skipped.length) {
      console.log(`   Skipped ${skipped.length}:`);
      for (const s of skipped) console.log(`     - ${s.eventId}: ${s.error}`);
    }
  }
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
