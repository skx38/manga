import 'server-only';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Server-only: returns the signed-in user's id, or `null` if anonymous.
 *
 * For API routes that require auth, return `401` when this is null:
 *
 *     const userId = await getCurrentUserId();
 *     if (!userId) return new Response('Unauthorized', { status: 401 });
 */
export async function getCurrentUserId(): Promise<string | null> {
    const session = await getServerSession(authOptions);
    return ((session?.user as { id?: string } | undefined)?.id) ?? null;
}

/**
 * Server-only convenience for RSC pages and dev flows. If signed in, returns
 * the real user id. Otherwise, falls back to `process.env.DEV_DEMO_USER_ID`
 * (set in `.env.local` to keep the existing seeded demo data working) or
 * returns `null`.
 *
 * Do **not** use this in API routes that mutate data — use
 * `getCurrentUserId()` and gate on it.
 */
export async function getCurrentUserIdOrDemo(): Promise<string | null> {
    const real = await getCurrentUserId();
    if (real) return real;
    return process.env.DEV_DEMO_USER_ID ?? null;
}
