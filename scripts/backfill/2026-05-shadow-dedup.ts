#!/usr/bin/env tsx
/**
 * SHADOW-001 backfill — consolidate duplicate profiles that collide on
 * `email` / `invite_email` so the unique partial index can be added.
 *
 * Usage:
 *   npx tsx scripts/backfill/2026-05-shadow-dedup.ts --validateOnly
 *   npx tsx scripts/backfill/2026-05-shadow-dedup.ts --commit
 *
 * Always run --validateOnly first and read the planned consolidation log.
 * The script reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local
 * (or whichever .env file your shell already loaded).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { findCollisionGroups, type CollisionGroup, type ProfileRow } from './shadow-dedup-core';

export interface DedupResult {
  groupsFound: number;
  duplicatesConsolidated: number;
  errors: { groupKey: string; error: string }[];
}

export interface DedupOptions {
  commit: boolean;
  log?: (msg: string) => void;
}

export async function fetchAllProfiles(client: SupabaseClient): Promise<ProfileRow[]> {
  const rows: ProfileRow[] = [];
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await client
      .from('profiles')
      .select('id, email, invite_email, is_shadow, user_id, created_at, full_name')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`fetchAllProfiles failed: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as ProfileRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

/**
 * Run the dedup over a set of collision groups. Each duplicate is merged
 * onto its canonical via `transfer_shadow_profile_references` (which is the
 * one place that owns the FK-rewrite logic), then deleted.
 */
export async function consolidateGroups(
  client: SupabaseClient,
  groups: CollisionGroup[],
  opts: DedupOptions
): Promise<DedupResult> {
  const log = opts.log ?? ((m: string) => console.log(m));
  const result: DedupResult = { groupsFound: groups.length, duplicatesConsolidated: 0, errors: [] };

  for (const g of groups) {
    const groupKey = g.emailKeys.join(',');
    log(
      `[group ${groupKey}] canonical=${g.canonical.id} (${g.canonical.user_id ? 'real' : 'shadow'}, created ${g.canonical.created_at}), duplicates=${g.duplicates.length}`
    );
    for (const dup of g.duplicates) {
      log(`  - dup ${dup.id} (${dup.user_id ? 'real' : 'shadow'}, created ${dup.created_at})`);
    }
    if (!opts.commit) continue;

    try {
      for (const dup of g.duplicates) {
        const { error: rpcError } = await client.rpc('transfer_shadow_profile_references', {
          p_old_id: dup.id,
          p_new_id: g.canonical.id,
        });
        if (rpcError) throw new Error(`transfer failed for ${dup.id}: ${rpcError.message}`);
        const { error: delError } = await client.from('profiles').delete().eq('id', dup.id);
        if (delError) throw new Error(`delete failed for ${dup.id}: ${delError.message}`);
        result.duplicatesConsolidated += 1;
      }
    } catch (err) {
      result.errors.push({ groupKey, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return result;
}

function parseArgs(argv: string[]): DedupOptions & { help: boolean } {
  const commit = argv.includes('--commit');
  const validateOnly = argv.includes('--validateOnly');
  const help = argv.includes('--help') || argv.includes('-h');
  if (commit && validateOnly) {
    console.error('Pass exactly one of --commit or --validateOnly, not both.');
    process.exit(2);
  }
  if (!commit && !validateOnly && !help) {
    console.error('Pass --validateOnly (preview) or --commit (apply).');
    process.exit(2);
  }
  return { commit, help };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('Usage: tsx scripts/backfill/2026-05-shadow-dedup.ts [--validateOnly | --commit]');
    return;
  }

  loadEnv({ path: '.env.local' });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const client = createClient(url, key, { auth: { persistSession: false } });

  console.log(`Fetching profiles from ${url}…`);
  const profiles = await fetchAllProfiles(client);
  console.log(`Loaded ${profiles.length} profiles.`);

  const groups = findCollisionGroups(profiles);
  console.log(`Found ${groups.length} collision groups.`);

  if (groups.length === 0) {
    console.log('No collisions — safe to apply the unique-index migration.');
    return;
  }

  const result = await consolidateGroups(client, groups, opts);
  if (opts.commit) {
    console.log(
      `\nConsolidated ${result.duplicatesConsolidated} duplicate(s) across ${result.groupsFound} group(s). Errors: ${result.errors.length}.`
    );
    for (const e of result.errors) console.error(`  ! ${e.groupKey}: ${e.error}`);
    if (result.errors.length > 0) process.exit(1);
  } else {
    console.log('\nValidate-only run — no rows changed. Re-run with --commit to apply.');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
