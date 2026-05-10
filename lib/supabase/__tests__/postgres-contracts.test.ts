/**
 * Structural contract tests for the Postgres routines that back three
 * unbreakable-core scenarios:
 *   - authz:fk-transfer-atomicity
 *   - authz:invite-email-auto-link-on-signup
 *   - auth:signup-atomic
 *
 * These properties live in plpgsql code that no application-layer mock can
 * exercise. Until a real Postgres test rig (pgTAP / Supabase test branch) is
 * stood up, these tests assert the migration SQL contains the load-bearing
 * clauses — so a refactor that silently drops one of them is caught by CI.
 *
 * When the Postgres test rig lands, replace these structural assertions
 * with real seeded-state tests (file paths suggested below).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'supabase', 'migrations');

function readMigration(filename: string): string {
  return readFileSync(join(MIGRATIONS_DIR, filename), 'utf8');
}

describe('authz:fk-transfer-atomicity (transfer_shadow_profile_references)', () => {
  const sql = readMigration('20260425000001_unified_shadow_transfer_function.sql');

  it('declares the function with SECURITY DEFINER (runs with owner privileges)', () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION transfer_shadow_profile_references[\s\S]+SECURITY DEFINER/
    );
  });

  it('runs inside a single function call (atomic per Postgres semantics)', () => {
    // plpgsql functions execute in a single transaction by default. The
    // unbreakable property piggybacks on that: if any UPDATE inside fails,
    // the whole function aborts and Postgres rolls back. We assert that the
    // function does NOT introduce its own subtransactions / SAVEPOINTs that
    // could swallow a failure mid-way.
    expect(sql).not.toMatch(/\bSAVEPOINT\b/i);
    expect(sql).not.toMatch(/EXCEPTION\s+WHEN/);
  });

  it('rejects null/equal ids before doing any work', () => {
    expect(sql).toMatch(/p_old_id IS NULL OR p_new_id IS NULL/);
    expect(sql).toMatch(/p_old_id = p_new_id/);
  });

  it('updates the FK columns (not just one) — covers every dependent table', () => {
    // Each of these tables FKs profiles(id) and must be migrated together.
    const expectedTables = ['lessons', 'assignments', 'student_repertoire', 'practice_sessions'];
    for (const t of expectedTables) {
      expect(sql).toMatch(new RegExp(`UPDATE\\s+${t}\\b`, 'i'));
    }
  });

  it('returns the per-table row counts for audit logging', () => {
    expect(sql).toMatch(/RETURNS\s+JSONB/i);
    expect(sql).toMatch(/GET DIAGNOSTICS\s+v_count\s*=\s*ROW_COUNT/i);
  });
});

describe('authz:invite-email-auto-link-on-signup (handle_new_user trigger)', () => {
  const sql = readMigration('20260425000002_rewrite_handle_new_user_trigger.sql');

  it('matches shadow profiles on invite_email + is_shadow', () => {
    // The query that finds a shadow to link must require BOTH conditions —
    // matching just by email would steal a non-shadow profile.
    expect(sql).toMatch(/invite_email\s*=\s*new\.email/);
    expect(sql).toMatch(/is_shadow/);
  });

  it('prioritises non-shadow email match before invite_email match', () => {
    // Migration uses bare `email = new.email` (no `profiles.` prefix). The
    // priority order shows up in the CASE WHEN branches: 1, 2, 3.
    expect(sql).toMatch(/email\s*=\s*new\.email\s+AND\s+NOT\s+is_shadow.*THEN\s*1/i);
    expect(sql).toMatch(/invite_email\s*=\s*new\.email\s+AND\s+is_shadow.*THEN\s*2/i);
  });

  it('calls transfer_shadow_profile_references when a shadow is found', () => {
    expect(sql).toMatch(/transfer_shadow_profile_references/);
  });

  it('is wired up as an AFTER INSERT trigger on auth.users', () => {
    expect(sql).toMatch(/CREATE\s+(OR\s+REPLACE\s+)?TRIGGER/i);
    expect(sql).toMatch(/AFTER\s+INSERT\s+ON\s+auth\.users/i);
  });
});

describe('auth:signup-atomic (handle_new_user trigger atomicity)', () => {
  const sql = readMigration('20260425000002_rewrite_handle_new_user_trigger.sql');

  it('does not swallow exceptions — failures propagate to the auth.users INSERT', () => {
    // An exception inside an AFTER INSERT trigger rolls back the INSERT.
    // If the trigger catches and discards exceptions, atomicity is broken.
    expect(sql).not.toMatch(/EXCEPTION\s+WHEN\s+OTHERS\s+THEN\s+NULL/i);
    expect(sql).not.toMatch(/EXCEPTION\s+WHEN\s+OTHERS\s+THEN\s+\/\*\s*ignore/i);
  });

  it('creates the profile row in the same trigger that runs on auth.users INSERT', () => {
    // INSERT INTO profiles must happen inside the trigger function so that
    // a failure to insert into profiles aborts the surrounding tx.
    expect(sql).toMatch(/INSERT\s+INTO\s+(public\.)?profiles\b/i);
  });

  it('uses SECURITY DEFINER so the trigger can bypass RLS for the insert', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION[\s\S]+SECURITY DEFINER/);
  });
});
