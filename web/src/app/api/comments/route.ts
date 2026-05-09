import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get('chapterId');
        const postId = searchParams.get('postId');

        if (!chapterId && !postId) {
            return NextResponse.json({ error: 'Missing chapterId or postId' }, { status: 400 });
        }

        const where: any = {};
        if (chapterId) where.chapterId = chapterId;
        if (postId) where.postId = postId;

        // Only fetch top-level comments, then include replies
        where.parentId = null;

        const comments = await prisma.comment.findMany({
            where,
            include: {
                user: { select: { id: true, username: true } },
                votes: true,
                replies: {
                    include: {
                        user: { select: { id: true, username: true } },
                        votes: true,
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform to add scores and user vote
        const transform = (c: any) => {
            // In a real app, we would get the current user ID from session/token
            // For now, we check against 'demo_user_id'
            const currentUserId = 'demo_user_id';
            const userVote = c.votes.find((v: any) => v.userId === currentUserId)?.value || 0;

            return {
                ...c,
                score: c.votes.reduce((acc: number, v: any) => acc + v.value, 0),
                userVote,
                replies: c.replies?.map(transform) || []
            };
        };

        return NextResponse.json(comments.map(transform));
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { content, userId, chapterId, postId, parentId, isSpoiler } = body;

        if (!content || !userId || (!chapterId && !postId)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure user exists (Mock User Fix)
        if (userId === 'demo_user_id') {
            await prisma.user.upsert({
                where: { id: userId },
                update: {},
                create: {
                    id: userId,
                    username: 'Demo User',
                    email: 'demo_comment_user@example.com',
                }
            });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                userId,
                chapterId,
                postId,
                parentId,
                isSpoiler: isSpoiler || false,
            },
            include: {
                user: { select: { id: true, username: true } }
            }
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing comment ID' }, { status: 400 });
        }

        // Check if comment has replies
        const comment = await prisma.comment.findUnique({
            where: { id },
            include: { _count: { select: { replies: true } } }
        });

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        // If replies exist, mark as deleted. If not, hard delete (optional, but let's stick to mark as deleted for consistency or hard delete if leaf)
        // Reddit style: always mark as deleted if it has children, or just mark as deleted to preserve tree structure.
        // Let's mark as deleted.

        const updated = await prisma.comment.update({
            where: { id },
            data: {
                isDeleted: true,
                content: '[deleted]',
                // We might want to keep the user relation or disconnect it. Reddit shows [deleted] user.
                // For now, let's keep the user but frontend will display [deleted]
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error deleting comment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, content } = body;

        if (!id || !content) {
            return NextResponse.json({ error: 'Missing ID or content' }, { status: 400 });
        }

        const updated = await prisma.comment.update({
            where: { id },
            data: {
                content,
                isEdited: true
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating comment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
