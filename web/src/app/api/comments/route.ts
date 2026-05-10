import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { rateLimit } from '@/lib/rateLimit';
import { ensureChapterDiscussion } from '@/lib/chapterDiscussion';
import { detectBannedWord } from '@/lib/permissions';

/** Extract unique @username mentions from comment content. */
function parseMentions(content: string): string[] {
    const matches = content.match(/@(\w{1,32})/g) ?? [];
    return [...new Set(matches.map((m) => m.slice(1)))];
}

const prisma = new PrismaClient();

async function createCommentNotifications({
    comment,
    userId,
    parentId,
    resolvedPostId,
}: {
    comment: { id: string; content: string };
    userId: string;
    parentId?: string;
    resolvedPostId?: string;
}) {
    try {
        const jobs: Promise<any>[] = [];

        // REPLY notification: tell the parent comment author they got a reply.
        if (parentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { userId: true },
            });
            if (parent && parent.userId !== userId) {
                jobs.push(
                    prisma.notification.create({
                        data: {
                            userId: parent.userId,
                            type: 'REPLY',
                            actorId: userId,
                            commentId: comment.id,
                            postId: resolvedPostId,
                        },
                    })
                );
            }
        }

        // MENTION notifications: parse @username and notify each mentioned user.
        const mentions = parseMentions(comment.content);
        if (mentions.length > 0) {
            const mentionedUsers = await prisma.user.findMany({
                where: { username: { in: mentions } },
                select: { id: true },
            });
            for (const mu of mentionedUsers) {
                if (mu.id !== userId) {
                    jobs.push(
                        prisma.notification.create({
                            data: {
                                userId: mu.id,
                                type: 'MENTION',
                                actorId: userId,
                                commentId: comment.id,
                                postId: resolvedPostId,
                            },
                        })
                    );
                }
            }
        }

        await Promise.all(jobs);
    } catch (e) {
        console.error('Notification creation failed (non-fatal):', e);
    }
}

export async function GET(request: Request) {
    try {
        const currentUserId = await getCurrentUserIdOrDemo();
        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get('chapterId');
        const postId = searchParams.get('postId');

        if (!chapterId && !postId) {
            return NextResponse.json({ error: 'Missing chapterId or postId' }, { status: 400 });
        }

        // Resolve chapterId to the canonical chapter-discussion Post so both
        // the reader and community surfaces share the same comment rows.
        let resolvedPostId = postId;
        if (chapterId) {
            const post = await ensureChapterDiscussion(chapterId);
            resolvedPostId = post.id;
        }

        const comments = await prisma.comment.findMany({
            where: { postId: resolvedPostId!, parentId: null },
            include: {
                user: { select: { id: true, username: true } },
                votes: true,
                replies: {
                    include: {
                        user: { select: { id: true, username: true } },
                        votes: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const transform = (c: any): any => ({
            ...c,
            score: c.votes.reduce((acc: number, v: any) => acc + v.value, 0),
            userVote: currentUserId
                ? c.votes.find((v: any) => v.userId === currentUserId)?.value || 0
                : 0,
            replies: c.replies?.map(transform) || [],
        });

        return NextResponse.json(comments.map(transform));
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const limit = rateLimit(userId, 'comment.create', 10, 60_000);
        if (!limit.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

        const body = await request.json();
        const { content, chapterId, postId, parentId, isSpoiler } = body;

        if (!content || (!chapterId && !postId)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Route chapter comments through the canonical chapter-discussion Post.
        let resolvedPostId = postId as string | undefined;
        if (chapterId) {
            const post = await ensureChapterDiscussion(chapterId);
            resolvedPostId = post.id;
        }

        // Check that the post isn't locked, and grab the comicId for banned-word lookup.
        let comicId: string | null = null;
        if (resolvedPostId) {
            const post = await prisma.post.findUnique({
                where: { id: resolvedPostId },
                select: { isLocked: true, comicId: true },
            });
            if (post?.isLocked) {
                return NextResponse.json({ error: 'Post is locked' }, { status: 403 });
            }
            comicId = post?.comicId ?? null;
        }

        // Banned-word filter — auto-flag rather than reject.
        let bannedHit: string | null = null;
        if (comicId) {
            const comic = await prisma.comic.findUnique({
                where: { id: comicId },
                select: { bannedWords: true },
            });
            bannedHit = detectBannedWord(content, comic?.bannedWords ?? []);
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                userId,
                postId: resolvedPostId,
                parentId,
                isSpoiler: isSpoiler || false,
            },
            include: { user: { select: { id: true, username: true } } },
        });

        if (bannedHit) {
            await prisma.report.create({
                data: {
                    reporterId: userId,
                    commentId: comment.id,
                    reason: 'SPAM',
                    details: `Auto-flag: banned word "${bannedHit}"`,
                },
            });
        }

        // Fire-and-forget notifications (don't await so the response is fast).
        void createCommentNotifications({ comment, userId, parentId, resolvedPostId });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing comment ID' }, { status: 400 });

        const comment = await prisma.comment.findUnique({
            where: { id },
            select: { userId: true },
        });
        if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        if (comment.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const updated = await prisma.comment.update({
            where: { id },
            data: { isDeleted: true, content: '[deleted]' },
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error deleting comment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, content } = body;
        if (!id || !content) return NextResponse.json({ error: 'Missing ID or content' }, { status: 400 });

        const comment = await prisma.comment.findUnique({
            where: { id },
            select: { userId: true },
        });
        if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        if (comment.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const updated = await prisma.comment.update({
            where: { id },
            data: { content, isEdited: true, editedAt: new Date() },
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating comment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
