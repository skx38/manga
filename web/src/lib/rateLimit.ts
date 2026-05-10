// Tiny in-memory token-bucket limiter, per-process.
// Good enough for our single-region Next deployment; if we ever go
// horizontally scaled, swap the Map for Upstash/Redis without touching callers.

interface Bucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
    ok: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * Returns ok=false (and the response should be 429) if the user has exceeded
 * `max` actions of the given kind in the last `windowMs` milliseconds.
 */
export function rateLimit(
    userId: string,
    action: string,
    max: number,
    windowMs: number,
): RateLimitResult {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
        const fresh = { count: 1, resetAt: now + windowMs };
        buckets.set(key, fresh);
        return { ok: true, remaining: max - 1, resetAt: fresh.resetAt };
    }

    if (existing.count >= max) {
        return { ok: false, remaining: 0, resetAt: existing.resetAt };
    }

    existing.count++;
    return { ok: true, remaining: max - existing.count, resetAt: existing.resetAt };
}

// Periodic GC so the Map can't grow unbounded with one-off keys.
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, bucket] of buckets) {
            if (bucket.resetAt <= now) buckets.delete(key);
        }
    }, 60_000).unref?.();
}
