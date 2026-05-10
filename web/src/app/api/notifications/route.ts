import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread') === 'true';
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

        const where: any = { userId };
        if (unreadOnly) where.readAt = null;

        const notifications = await prisma.notification.findMany({
            where,
            include: {
                actor: { select: { id: true, username: true, image: true } },
                post: { select: { id: true, title: true } },
                comment: { select: { id: true, content: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, readAt: null },
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Mark notifications as read. Pass `ids` array or omit to mark all.
export async function PATCH(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json().catch(() => ({}));
        const ids: string[] = body.ids || [];

        const where: any = { userId, readAt: null };
        if (ids.length > 0) where.id = { in: ids };

        await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error marking notifications read:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
