import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SYSTEM_USER_ID = '__system__';

async function ensureSystemUser() {
    await prisma.user.upsert({
        where: { id: SYSTEM_USER_ID },
        update: {},
        create: { id: SYSTEM_USER_ID, username: '__system__' },
    });
}

/**
 * Returns (or lazily creates) the single canonical CHAPTER_DISCUSSION Post
 * for a given chapter. Both the reader comment panel and the community feed
 * share this Post so votes and comments are never split across two rows.
 */
export async function ensureChapterDiscussion(chapterId: string) {
    const existing = await prisma.post.findUnique({
        where: { chapterId },
    });
    if (existing) return existing;

    const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { comicId: true, number: true, title: true },
    });
    if (!chapter) throw new Error(`Chapter not found: ${chapterId}`);

    await ensureSystemUser();

    return prisma.post.upsert({
        where: { chapterId },
        update: {},
        create: {
            kind: 'CHAPTER_DISCUSSION',
            chapterId,
            comicId: chapter.comicId,
            userId: SYSTEM_USER_ID,
            title: `Ch. ${chapter.number}: ${chapter.title}`,
        },
    });
}
