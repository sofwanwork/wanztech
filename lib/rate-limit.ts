/**
 * Rate limiter for KlikForm.
 *
 * Backend strategy:
 *  - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, use Upstash
 *    Redis (recommended for multi-region Vercel deployments).
 *  - Otherwise fall back to per-instance in-memory Map (good for MVP / single
 *    instance, but inconsistent across serverless cold starts and regions).
 *
 * NOTE: The Upstash branch is implemented as a runtime-detected dynamic call so
 * we don't force the dependency on apps that don't need it. Add `@upstash/redis`
 * to dependencies when you want to enable it.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodic cleanup (in-memory branch only)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60_000);
}

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

const useUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

let upstashWarned = false;

async function checkRateLimitUpstash(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    // Dynamic import keeps `@upstash/redis` optional. We use a string-based
    // import expression so TypeScript doesn't try to resolve the module at
    // compile time when it's not installed.
    const upstashModule = '@upstash/redis';
    const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ upstashModule).catch(
      () => null
    )) as {
      Redis?: new (...args: unknown[]) => unknown;
    } | null;
    if (!mod?.Redis) {
      if (!upstashWarned) {
        upstashWarned = true;
        console.warn(
          '[rate-limit] UPSTASH_REDIS_REST_* set but @upstash/redis is not installed. Falling back to in-memory.'
        );
      }
      return checkRateLimitMemory(key, options);
    }
    const redis = new mod.Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }) as {
      incr: (k: string) => Promise<number>;
      pexpire: (k: string, ms: number) => Promise<number>;
      pttl: (k: string) => Promise<number>;
    };
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, options.windowMs);
    }
    const ttl = await redis.pttl(key);
    const resetTime = Date.now() + (ttl > 0 ? ttl : options.windowMs);
    if (count > options.limit) {
      return { success: false, remaining: 0, resetTime };
    }
    return { success: true, remaining: options.limit - count, resetTime };
  } catch (err) {
    console.error('[rate-limit] Upstash error, falling back to memory:', err);
    return checkRateLimitMemory(key, options);
  }
}

function checkRateLimitMemory(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    entry = { count: 1, resetTime: now + options.windowMs };
    rateLimitStore.set(key, entry);
    return { success: true, remaining: options.limit - 1, resetTime: entry.resetTime };
  }

  entry.count++;

  if (entry.count > options.limit) {
    return { success: false, remaining: 0, resetTime: entry.resetTime };
  }

  return { success: true, remaining: options.limit - entry.count, resetTime: entry.resetTime };
}

/**
 * Check rate limit for an identifier (usually IP address).
 *
 * @param identifier  Stable string (typically IP). Use namespaced keys via the
 *                    `bucket` argument to avoid collisions across features.
 * @param options     Limit + windowMs.
 * @param bucket      Logical bucket name, prefixed onto the key.
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60_000 },
  bucket = 'default'
): Promise<RateLimitResult> {
  const key = `rl:${bucket}:${identifier}`;
  if (useUpstash) {
    return checkRateLimitUpstash(key, options);
  }
  return checkRateLimitMemory(key, options);
}

/**
 * Get client IP from standard proxy / CDN headers.
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Rate limit configurations for different routes.
 */
export const RATE_LIMITS = {
  /** Form submission: 20 per minute per IP */
  formSubmission: { limit: 20, windowMs: 60_000 },
  /** Certificate check: 10 per minute per IP (anti-IC enumeration) */
  certificateCheck: { limit: 10, windowMs: 60_000 },
  /** Login attempts: 5 per minute per IP */
  loginAttempt: { limit: 5, windowMs: 60_000 },
  /** API calls: 100 per minute per IP */
  apiCall: { limit: 100, windowMs: 60_000 },
} as const;
