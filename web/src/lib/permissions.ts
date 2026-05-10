import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check whether a user moderates a given comic. Used to gate Lock/Pin/Remove
 * actions, the /c/{slug}/mod queue, and Report GETs.
 */
export async function isCommunityMod(userId: string | null, comicId: string): Promise<boolean> {
    if (!userId) return false;
    const row = await prisma.comicMod.findUnique({
        where: { comicId_userId: { comicId, userId } },
    });
    return !!row;
}

/** Returns the set of comicIds a user moderates. */
export async function getModeratedComics(userId: string): Promise<string[]> {
    const rows = await prisma.comicMod.findMany({
        where: { userId },
        select: { comicId: true },
    });
    return rows.map((r) => r.comicId);
}

/**
 * Detect banned words in user-submitted text. Case-insensitive whole-ish word
 * match. Returns the first hit (or null) so the caller can flag the content.
 */
export function detectBannedWord(content: string, bannedWords: string[]): string | null {
    const lc = content.toLowerCase();
    for (const word of bannedWords) {
        const w = word.trim().toLowerCase();
        if (w && lc.includes(w)) return word;
    }
    return null;
}
