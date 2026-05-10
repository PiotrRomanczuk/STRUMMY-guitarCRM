import { createIdempotencyCache } from '@/lib/utils/idempotency-cache';

describe('createIdempotencyCache', () => {
  it('returns undefined for an unknown key', () => {
    const c = createIdempotencyCache<string>();
    expect(c.get('missing')).toBeUndefined();
  });

  it('returns the stored value within the TTL window', () => {
    let t = 0;
    const c = createIdempotencyCache<string>({ ttlMs: 1_000, now: () => t });
    c.set('k', 'v1');
    t = 999;
    expect(c.get('k')).toBe('v1');
  });

  it('returns undefined and evicts after the TTL window', () => {
    let t = 0;
    const c = createIdempotencyCache<string>({ ttlMs: 1_000, now: () => t });
    c.set('k', 'v1');
    t = 1_001;
    expect(c.get('k')).toBeUndefined();
    expect(c.size()).toBe(0);
  });

  it('a second `set` for the same key replaces the first value', () => {
    let t = 0;
    const c = createIdempotencyCache<string>({ ttlMs: 1_000, now: () => t });
    c.set('k', 'v1');
    t = 100;
    c.set('k', 'v2');
    expect(c.get('k')).toBe('v2');
  });

  it('honours maxEntries by evicting the oldest entry', () => {
    let t = 0;
    const c = createIdempotencyCache<number>({
      ttlMs: 60_000,
      maxEntries: 3,
      now: () => t,
    });
    c.set('a', 1);
    t += 1;
    c.set('b', 2);
    t += 1;
    c.set('c', 3);
    t += 1;
    c.set('d', 4); // forces eviction of 'a'
    expect(c.get('a')).toBeUndefined();
    expect(c.get('b')).toBe(2);
    expect(c.get('c')).toBe(3);
    expect(c.get('d')).toBe(4);
    expect(c.size()).toBe(3);
  });

  it('a duplicate write for the same key does NOT count as a second insertion (idempotency property)', () => {
    let t = 0;
    const c = createIdempotencyCache<string>({
      ttlMs: 60_000,
      maxEntries: 2,
      now: () => t,
    });
    c.set('a', 'v');
    t += 1;
    c.set('a', 'v'); // same key
    t += 1;
    c.set('b', 'v'); // second distinct key
    expect(c.size()).toBe(2);
    expect(c.get('a')).toBe('v');
    expect(c.get('b')).toBe('v');
  });

  it('clear() empties the cache', () => {
    const c = createIdempotencyCache<string>();
    c.set('a', '1');
    c.set('b', '2');
    c.clear();
    expect(c.size()).toBe(0);
    expect(c.get('a')).toBeUndefined();
  });

  it('uses Date.now by default and a typical 60s TTL', () => {
    const c = createIdempotencyCache<string>();
    c.set('k', 'v');
    // Within the same tick the value is retrievable.
    expect(c.get('k')).toBe('v');
  });
});
