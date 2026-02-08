/**
 * Simple in-memory rate limiter for public routes
 * For production, consider using Upstash Redis or similar
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (resets on server restart)
// For production with multiple instances, use Redis
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Clean every minute

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

/**
 * Check rate limit for an identifier (usually IP address)
 */
export function checkRateLimit(
    identifier: string,
    options: RateLimitOptions = { limit: 10, windowMs: 60000 }
): RateLimitResult {
    const now = Date.now();
    const key = `rate:${identifier}`;

    let entry = rateLimitStore.get(key);

    // Create new entry if doesn't exist or window has expired
    if (!entry || entry.resetTime < now) {
        entry = {
            count: 1,
            resetTime: now + options.windowMs,
        };
        rateLimitStore.set(key, entry);
        return {
            success: true,
            remaining: options.limit - 1,
            resetTime: entry.resetTime,
        };
    }

    // Increment count
    entry.count++;

    // Check if over limit
    if (entry.count > options.limit) {
        return {
            success: false,
            remaining: 0,
            resetTime: entry.resetTime,
        };
    }

    return {
        success: true,
        remaining: options.limit - entry.count,
        resetTime: entry.resetTime,
    };
}

/**
 * Get client IP from request headers
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
 * Rate limit configurations for different routes
 */
export const RATE_LIMITS = {
    // Form submission: 10 per minute per IP
    formSubmission: { limit: 10, windowMs: 60000 },
    // Certificate check: 20 per minute per IP
    certificateCheck: { limit: 20, windowMs: 60000 },
    // Login attempts: 5 per minute per IP
    loginAttempt: { limit: 5, windowMs: 60000 },
    // API calls: 100 per minute per IP
    apiCall: { limit: 100, windowMs: 60000 },
};
