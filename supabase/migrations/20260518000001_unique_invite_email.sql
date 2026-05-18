-- ============================================================================
-- Migration: Unique partial index on profiles(invite_email)
-- ----------------------------------------------------------------------------
-- ADR 0002 / SHADOW-001. Prerequisite is the dedup backfill at
-- `scripts/backfill/2026-05-shadow-dedup.ts --commit`. If the backfill has not
-- run (or did not converge), the DO block below RAISES so we fail loud here
-- instead of letting the CREATE UNIQUE INDEX error halfway through.
-- ============================================================================

DO $$
DECLARE
  v_invite_collisions INTEGER;
  v_cross_collisions INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_invite_collisions FROM (
    SELECT invite_email
    FROM profiles
    WHERE invite_email IS NOT NULL
    GROUP BY invite_email
    HAVING COUNT(*) > 1
  ) dup;

  -- Also flag the cross-column case: invite_email of one profile collides with
  -- email of a *different* profile. The unique index alone doesn't enforce
  -- this, but it's what the backfill consolidates, so a residual count here
  -- indicates the backfill was not run to completion.
  SELECT COUNT(*) INTO v_cross_collisions FROM profiles a
  JOIN profiles b
    ON a.id <> b.id
   AND a.invite_email IS NOT NULL
   AND a.invite_email = b.email;

  IF v_invite_collisions > 0 OR v_cross_collisions > 0 THEN
    RAISE EXCEPTION
      'Refusing to add uq_profiles_invite_email: % invite_email duplicates and % cross-column (invite_email↔email) collisions remain. Run `npx tsx scripts/backfill/2026-05-shadow-dedup.ts --commit` first.',
      v_invite_collisions, v_cross_collisions;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_invite_email
  ON profiles(invite_email)
  WHERE invite_email IS NOT NULL;

COMMENT ON INDEX uq_profiles_invite_email IS
  'SHADOW-001 / ADR 0002. Guarantees at most one profile per invite_email so shadow→real linking is deterministic.';
