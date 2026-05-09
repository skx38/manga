import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const currentUserId = await getCurrentUserIdOrDemo();
        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get('chapterId');
        const postId = searchParams.get('postId');

        if (!chapterId && !postId) {
            return NextResponse.json({ error: 'Missing chapterId or postId' }, { status: 400 });
        }

        const where: any = { parentId: null };
        if (chapterId) where.chapterId = chapterId;
        if (postId) where.postId = postId;

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

        const body = await request.json();
        const { content, chapterId, postId, parentId, isSpoiler } = body;

        if (!content || (!chapterId && !postId)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const comment = await prisma.comment.create({
            data: { content, userId, chapterId, postId, parentId, isSpoiler: isSpoiler || false },
            include: { user: { select: { id: true, username: true } } },
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
        if (!id) return NextResponse.json({ error: 'Missing comment ID' }, { status: 400 });

        const comment = await prisma.comment.findUnique({
            where: { id },
            include: { _count: { select: { replies: true } } },
        });
        if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

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
        const body = await request.json();
        const { id, content } = body;
        if (!id || !content) return NextResponse.json({ error: 'Missing ID or content' }, { status: 400 });

        const updated = await prisma.comment.update({
            where: { id },
            data: { content, isEdited: true },
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating comment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
