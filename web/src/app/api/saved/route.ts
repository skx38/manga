import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const saved = await prisma.savedItem.findMany({
            where: { userId },
            include: {
                post: {
                    include: {
                        user: { select: { id: true, username: true } },
                        comic: { select: { title: true, slug: true, coverImageUrl: true } },
                        _count: { select: { comments: true, votes: true } },
                    },
                },
                comment: {
                    include: {
                        user: { select: { id: true, username: true } },
                        post: { select: { id: true, title: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(saved);
    } catch (error) {
        console.error('Error fetching saved items:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { postId, commentId } = await request.json();
        if (!postId && !commentId) {
            return NextResponse.json({ error: 'Missing postId or commentId' }, { status: 400 });
        }

        // Toggle: if already saved, delete it.
        const existing = postId
            ? await prisma.savedItem.findUnique({ where: { userId_postId: { userId, postId } } })
            : await prisma.savedItem.findUnique({ where: { userId_commentId: { userId, commentId } } });

        if (existing) {
            await prisma.savedItem.delete({ where: { id: existing.id } });
            return NextResponse.json({ saved: false });
        }

        await prisma.savedItem.create({ data: { userId, postId, commentId } });
        return NextResponse.json({ saved: true }, { status: 201 });
    } catch (error) {
        console.error('Error toggling saved item:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        await prisma.savedItem.deleteMany({ where: { id, userId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error deleting saved item:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
