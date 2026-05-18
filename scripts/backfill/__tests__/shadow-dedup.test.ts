/**
 * Unit tests for the SHADOW-001 dedup logic.
 *
 * Pure-logic only — no Supabase. The integration spec
 * (`shadow-dedup.integration.test.ts`) exercises the script end-to-end.
 */
import { findCollisionGroups, pickCanonical, type ProfileRow } from '../shadow-dedup-core';

function profile(over: Partial<ProfileRow>): ProfileRow {
  return {
    id: over.id ?? crypto.randomUUID(),
    email: over.email ?? null,
    invite_email: over.invite_email ?? null,
    is_shadow: over.is_shadow ?? false,
    user_id: over.user_id ?? null,
    created_at: over.created_at ?? '2026-01-01T00:00:00Z',
    full_name: over.full_name ?? null,
  };
}

describe('pickCanonical', () => {
  it('prefers real (has user_id) over shadow', () => {
    const real = profile({ id: 'real', user_id: 'auth-1', created_at: '2026-03-01' });
    const shadow = profile({
      id: 'shadow',
      is_shadow: true,
      created_at: '2026-01-01',
    });
    expect(pickCanonical([shadow, real]).id).toBe('real');
  });

  it('among shadows, prefers oldest by created_at', () => {
    const newer = profile({ id: 'b', is_shadow: true, created_at: '2026-02-15' });
    const older = profile({ id: 'a', is_shadow: true, created_at: '2026-01-15' });
    expect(pickCanonical([newer, older]).id).toBe('a');
  });

  it('uses id as final deterministic tiebreaker', () => {
    const a = profile({ id: 'aaa', is_shadow: true, created_at: '2026-01-01' });
    const b = profile({ id: 'bbb', is_shadow: true, created_at: '2026-01-01' });
    expect(pickCanonical([b, a]).id).toBe('aaa');
  });
});

describe('findCollisionGroups', () => {
  it('returns no groups when every email is distinct', () => {
    const groups = findCollisionGroups([
      profile({ id: '1', email: 'a@x.com' }),
      profile({ id: '2', email: 'b@x.com' }),
      profile({ id: '3', invite_email: 'c@x.com' }),
    ]);
    expect(groups).toEqual([]);
  });

  it('groups a real profile with a shadow that has invite_email matching the real email', () => {
    const real = profile({
      id: 'real',
      email: 'student@x.com',
      user_id: 'auth-1',
      created_at: '2026-04-01',
    });
    const shadow = profile({
      id: 'shadow',
      is_shadow: true,
      email: 'placeholder@strummy.app',
      invite_email: 'student@x.com',
      created_at: '2026-01-01',
    });
    const [g] = findCollisionGroups([real, shadow]);
    expect(g.canonical.id).toBe('real');
    expect(g.duplicates.map((d) => d.id)).toEqual(['shadow']);
    expect(g.emailKeys).toContain('student@x.com');
  });

  it('groups two shadows that share an email value, canonical is the oldest', () => {
    const shadowA = profile({
      id: 'a',
      is_shadow: true,
      email: 'kid@x.com',
      created_at: '2026-01-01',
    });
    const shadowB = profile({
      id: 'b',
      is_shadow: true,
      email: 'kid@x.com',
      created_at: '2026-03-01',
    });
    const [g] = findCollisionGroups([shadowB, shadowA]);
    expect(g.canonical.id).toBe('a');
    expect(g.duplicates).toHaveLength(1);
    expect(g.duplicates[0].id).toBe('b');
  });

  it('treats email values case-insensitively and trims whitespace', () => {
    const a = profile({ id: 'a', email: 'Foo@Example.com' });
    const b = profile({ id: 'b', invite_email: ' foo@example.com ' });
    const groups = findCollisionGroups([a, b]);
    expect(groups).toHaveLength(1);
    expect(groups[0].duplicates).toHaveLength(1);
  });

  it('handles transitive groups via bridging invite_email', () => {
    // A: email=x   B: email=x invite_email=y   C: invite_email=y
    // All three must land in the same group.
    const a = profile({ id: 'A', email: 'x@x.com', created_at: '2026-01-01' });
    const b = profile({
      id: 'B',
      email: 'x@x.com',
      invite_email: 'y@x.com',
      created_at: '2026-01-02',
    });
    const c = profile({ id: 'C', invite_email: 'y@x.com', created_at: '2026-01-03' });
    const [g] = findCollisionGroups([a, b, c]);
    const all = [g.canonical.id, ...g.duplicates.map((d) => d.id)].sort();
    expect(all).toEqual(['A', 'B', 'C']);
    expect(g.canonical.id).toBe('A'); // oldest, all shadow
  });

  it('does not group profiles that share only a null email', () => {
    const groups = findCollisionGroups([
      profile({ id: '1', email: null, invite_email: null }),
      profile({ id: '2', email: null, invite_email: null }),
    ]);
    expect(groups).toEqual([]);
  });

  it('produces deterministic ordering across runs', () => {
    const rows = [
      profile({ id: 'r1', email: 'zeta@x.com' }),
      profile({ id: 'r2', email: 'zeta@x.com' }),
      profile({ id: 'r3', email: 'alpha@x.com' }),
      profile({ id: 'r4', email: 'alpha@x.com' }),
    ];
    const first = findCollisionGroups(rows).map((g) => g.emailKeys[0]);
    const second = findCollisionGroups([...rows].reverse()).map((g) => g.emailKeys[0]);
    expect(first).toEqual(second);
    expect(first[0]).toBe('alpha@x.com');
  });
});
