import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface Result {
  allowed: boolean;
  retryAfterMs: number;
}

// In-memory fallback (dev only)
interface BucketEntry {
  count: number;
  resetAt: number;
}
const store = new Map<string, BucketEntry>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60_000;

function memoryRateLimit(key: string): Result {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

let ratelimiter: Ratelimit | null = null;

function getUpstash(): Ratelimit | null {
  if (ratelimiter) return ratelimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  ratelimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "60 s"),
    analytics: true,
  });

  return ratelimiter;
}

export async function checkRateLimit(key: string): Promise<
  { allowed: true } | { allowed: false; retryAfterMs: number }
> {
  const upstash = getUpstash();

  if (!upstash) {
    // On Vercel multi-instance this is not sufficient, but kept as a safe dev fallback.
    const res = memoryRateLimit(key);
    if (res.allowed) return { allowed: true };
    return { allowed: false, retryAfterMs: res.retryAfterMs };
  }

  const res = await upstash.limit(key);
  if (res.success) return { allowed: true };

  const retryAfterMs = res.reset ? Math.max(0, res.reset - Date.now()) : WINDOW_MS;
  return { allowed: false, retryAfterMs };
}
