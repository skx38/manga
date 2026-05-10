/**
 * One-shot data migration: Phase 5b — Chapter Discussion Unification
 *
 * Run ONCE after `npx prisma migrate dev --name unify_chapter_discussions`:
 *   cd web && npx tsx scripts/migrate-chapter-discussions.ts
 *
 * What it does:
 *   1. Finds every distinct chapterId that has Comment rows with chapterId set.
 *   2. For each, upserts a CHAPTER_DISCUSSION Post (using the system user).
 *   3. Re-points those Comment rows to postId = <new post id>, clearing chapterId.
 *
 * Existing Vote rows are untouched — they stay linked to the same Comment.id,
 * which now lives under the canonical Post. Vote tallies survive intact.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SYSTEM_USER_ID = '__system__';

async function main() {
    // Ensure the system user exists.
    await prisma.user.upsert({
        where: { id: SYSTEM_USER_ID },
        update: {},
        create: { id: SYSTEM_USER_ID, username: '__system__' },
    });

    // Find all distinct chapterIds that still have comments stored under chapterId.
    const rows = await prisma.comment.findMany({
        where: { chapterId: { not: null } },
        select: { chapterId: true },
        distinct: ['chapterId'],
    });

    console.log(`Found ${rows.length} distinct chapters with legacy comments.`);
    let migrated = 0;

    for (const { chapterId } of rows) {
        if (!chapterId) continue;

        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            select: { comicId: true, number: true, title: true },
        });
        if (!chapter) {
            console.warn(`  Chapter ${chapterId} not found — skipping.`);
            continue;
        }

        // Upsert the canonical CHAPTER_DISCUSSION post.
        const post = await prisma.post.upsert({
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

        // Re-point all comments for this chapter to the post.
        const { count } = await prisma.comment.updateMany({
            where: { chapterId },
            data: { postId: post.id, chapterId: null },
        });

        console.log(`  Chapter ${chapterId} → Post ${post.id} (${count} comments migrated)`);
        migrated += count;
    }

    console.log(`\nDone. ${migrated} comments re-pointed to chapter-discussion Posts.`);
    console.log('Vote tallies are unaffected — they reference Comment.id which is unchanged.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
