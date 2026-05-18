/**
 * Pure logic for the shadow-dedup backfill (SHADOW-001).
 *
 * Two responsibilities, both side-effect free so they can be unit-tested
 * without a database:
 *   1. Group profiles that share an `email` or `invite_email` value
 *      (transitively — A↔X, B↔X,Y, C↔Y forms one group).
 *   2. Pick the canonical survivor in each group: real (has user_id) wins
 *      over shadow; ties broken by oldest `created_at`.
 *
 * Wiring (DB reads / writes / FK transfer) lives in the CLI script.
 */
export interface ProfileRow {
  id: string;
  email: string | null;
  invite_email: string | null;
  is_shadow: boolean | null;
  user_id: string | null;
  created_at: string;
  full_name?: string | null;
}

export interface CollisionGroup {
  /** Survivor — the profile every other row in the group will be merged onto. */
  canonical: ProfileRow;
  /** Profiles to be merged into canonical (excludes canonical). */
  duplicates: ProfileRow[];
  /** All email values that link rows in this group (debug-friendly). */
  emailKeys: string[];
}

/**
 * Group rows by transitive email/invite_email overlap. Singleton rows
 * (no collision) are dropped — the result contains only groups of size ≥2.
 */
export function findCollisionGroups(profiles: ProfileRow[]): CollisionGroup[] {
  // Union-find keyed by lowercased email value. Each profile's email and
  // invite_email (when set) join the same component.
  const parent = new Map<string, string>();
  const find = (k: string): string => {
    let cur = k;
    while (parent.get(cur) !== cur) {
      const p = parent.get(cur)!;
      parent.set(cur, parent.get(p)!);
      cur = parent.get(cur)!;
    }
    return cur;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  const ensure = (k: string) => {
    if (!parent.has(k)) parent.set(k, k);
  };
  const norm = (e: string | null): string | null => (e ? e.trim().toLowerCase() : null);

  const profileKeys = new Map<string, string[]>();
  for (const p of profiles) {
    const keys: string[] = [];
    const e = norm(p.email);
    const i = norm(p.invite_email);
    if (e) {
      ensure(e);
      keys.push(e);
    }
    if (i) {
      ensure(i);
      keys.push(i);
    }
    if (e && i) union(e, i);
    profileKeys.set(p.id, keys);
  }

  // Bucket profiles by component root.
  const buckets = new Map<string, ProfileRow[]>();
  const componentKeys = new Map<string, Set<string>>();
  for (const p of profiles) {
    const keys = profileKeys.get(p.id) ?? [];
    if (keys.length === 0) continue;
    const root = find(keys[0]);
    if (!buckets.has(root)) {
      buckets.set(root, []);
      componentKeys.set(root, new Set());
    }
    buckets.get(root)!.push(p);
    for (const k of keys) componentKeys.get(root)!.add(k);
  }

  const groups: CollisionGroup[] = [];
  for (const [root, rows] of buckets) {
    if (rows.length < 2) continue;
    const canonical = pickCanonical(rows);
    groups.push({
      canonical,
      duplicates: rows.filter((r) => r.id !== canonical.id),
      emailKeys: Array.from(componentKeys.get(root)!).sort(),
    });
  }
  // Deterministic ordering for snapshot-friendly output.
  groups.sort((a, b) => a.emailKeys[0].localeCompare(b.emailKeys[0]));
  return groups;
}

/**
 * Pick the canonical survivor in a group.
 *   - Real profile (user_id present) wins over shadow.
 *   - If multiple reals or multiple shadows: oldest by `created_at`.
 *   - Final tiebreak: lexicographically smallest id (deterministic).
 */
export function pickCanonical(rows: ProfileRow[]): ProfileRow {
  if (rows.length === 0) throw new Error('pickCanonical called with empty group');
  const score = (r: ProfileRow): number => (r.user_id ? 0 : 1);
  const sorted = [...rows].sort((a, b) => {
    const s = score(a) - score(b);
    if (s !== 0) return s;
    const t = a.created_at.localeCompare(b.created_at);
    if (t !== 0) return t;
    return a.id.localeCompare(b.id);
  });
  return sorted[0];
}
