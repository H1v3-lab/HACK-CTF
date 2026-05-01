/**
 * Simple in-memory rate limiter for /api/validate-flag.
 *
 * In production with multiple instances, replace this with Upstash Redis:
 *   @upstash/redis  + @upstash/ratelimit
 * and set UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN in your env.
 *
 * This implementation is intentionally zero-dependency and works for
 * single-instance deployments (dev + simple VPS / single-container).
 */

interface BucketEntry {
  count: number;
  resetAt: number;
}

// key → { count, resetAt }
const store = new Map<string, BucketEntry>();

/** Maximum flag submissions per window per user. */
const MAX_REQUESTS = 10;
/** Window length in milliseconds. */
const WINDOW_MS = 60_000; // 1 minute

/**
 * Check rate-limit for a given key (e.g. `userId`).
 * Returns `{ allowed: true }` when the request is within limits,
 * or `{ allowed: false, retryAfterMs }` when the limit is exceeded.
 */
export function checkRateLimit(
  key: string
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    // Start a new window
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true };
}
