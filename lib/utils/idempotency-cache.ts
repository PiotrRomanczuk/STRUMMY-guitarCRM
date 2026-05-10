/**
 * Server-side idempotency cache (chosen approach for
 * `create-lesson:idempotent-double-click` — see tasks/unbreakable-core.md).
 *
 * Tiny in-memory time-windowed Map: a request handler hashes a stable key
 * (e.g. `${userId}:${client_request_id}`), looks it up before doing the
 * write, and stores the response under that key for the TTL. A duplicate
 * request inside the window returns the cached response instead of
 * performing the write again.
 *
 * In-memory is acceptable for the double-click problem (browser-level
 * retries within a few seconds). For multi-region / load-balanced setups,
 * swap the Map for a Vercel KV / Upstash backing — the public surface is
 * identical.
 *
 * Not for security-sensitive replay protection — there's no signed token
 * or nonce. Bound the TTL to the worst-case retry window, not "forever."
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface IdempotencyCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  size(): number;
  clear(): void;
}

export interface IdempotencyCacheOptions {
  /** Time-to-live in milliseconds. Defaults to 60 seconds. */
  ttlMs?: number;
  /** Hard upper bound on entries to prevent unbounded memory growth. */
  maxEntries?: number;
  /** Optional clock for deterministic tests. */
  now?: () => number;
}

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 5_000;

export function createIdempotencyCache<T>(
  options: IdempotencyCacheOptions = {}
): IdempotencyCache<T> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const now = options.now ?? Date.now;
  const store = new Map<string, CacheEntry<T>>();

  function purgeExpired(at: number) {
    for (const [k, entry] of store) {
      if (entry.expiresAt <= at) store.delete(k);
    }
  }

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },

    set(key: string, value: T): void {
      const at = now();
      if (store.size >= maxEntries) {
        // Evict the oldest expired entries first; if none expired, evict
        // the oldest insertion (Map preserves insertion order).
        purgeExpired(at);
        if (store.size >= maxEntries) {
          const firstKey = store.keys().next().value;
          if (firstKey !== undefined) store.delete(firstKey);
        }
      }
      store.set(key, { value, expiresAt: at + ttlMs });
    },

    size(): number {
      return store.size;
    },

    clear(): void {
      store.clear();
    },
  };
}
