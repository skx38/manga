import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Nightly karma recompute. Call from a Vercel cron job or manually:
 *   curl -X POST /api/cron/recompute-karma
 *
 * Sums Vote.value grouped by the post/comment owner and updates
 * User.postKarma / User.commentKarma in a single batch of updates.
 */
export async function POST(request: Request) {
    // Simple bearer-token guard so it can't be abused publicly.
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const auth = request.headers.get('authorization');
        if (auth !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        // Aggregate post karma: SUM(vote.value) grouped by post.userId
        const postKarmaRows = await prisma.$queryRaw<{ userId: string; karma: bigint }[]>`
            SELECT p."userId", COALESCE(SUM(v.value), 0) AS karma
            FROM "Post" p
            LEFT JOIN "Vote" v ON v."postId" = p.id
            WHERE p."isDeleted" = false AND p."isRemoved" = false
              AND p."kind" = 'USER'
            GROUP BY p."userId"
        `;

        // Aggregate comment karma: SUM(vote.value) grouped by comment.userId
        const commentKarmaRows = await prisma.$queryRaw<{ userId: string; karma: bigint }[]>`
            SELECT c."userId", COALESCE(SUM(v.value), 0) AS karma
            FROM "Comment" c
            LEFT JOIN "Vote" v ON v."commentId" = c.id
            WHERE c."isDeleted" = false
            GROUP BY c."userId"
        `;

        // Merge into a single map per userId.
        const karmaMap = new Map<string, { post: number; comment: number }>();
        for (const row of postKarmaRows) {
            karmaMap.set(row.userId, { post: Number(row.karma), comment: 0 });
        }
        for (const row of commentKarmaRows) {
            const existing = karmaMap.get(row.userId) ?? { post: 0, comment: 0 };
            karmaMap.set(row.userId, { ...existing, comment: Number(row.karma) });
        }

        // Batch update users.
        const updates = [...karmaMap.entries()].map(([userId, { post, comment }]) =>
            prisma.user.update({
                where: { id: userId },
                data: { postKarma: post, commentKarma: comment },
            })
        );

        await prisma.$transaction(updates);

        return NextResponse.json({ ok: true, usersUpdated: updates.length });
    } catch (error) {
        console.error('Karma recompute failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
