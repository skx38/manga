import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';

const prisma = new PrismaClient();

// GET /api/community/danmu?chapterId=X
// Returns all danmu comments for a chapter, ordered by createdAt asc.
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    if (!chapterId) {
        return NextResponse.json({ error: 'chapterId required' }, { status: 400 });
    }

    const danmu = await (prisma as any).danmuComment.findMany({
        where: { chapterId },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            pageIndex: true,
            text: true,
            trackY: true,
            color: true,
            createdAt: true,
        },
    });

    return NextResponse.json(danmu);
}

// POST /api/community/danmu  body: { chapterId, pageIndex, text, trackY?, color? }
export async function POST(request: Request) {
    const userId = await getCurrentUserIdOrDemo();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { chapterId, pageIndex, text } = body;
    const trackY = typeof body.trackY === 'number' ? Math.min(0.95, Math.max(0.02, body.trackY)) : Math.random() * 0.85 + 0.05;
    const color = typeof body.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(body.color) ? body.color : null;

    if (!chapterId || typeof pageIndex !== 'number' || typeof text !== 'string') {
        return NextResponse.json({ error: 'chapterId, pageIndex, text required' }, { status: 400 });
    }

    const trimmed = text.trim();
    if (!trimmed) return NextResponse.json({ error: 'Empty text' }, { status: 400 });
    if (trimmed.length > 120) return NextResponse.json({ error: 'Text too long (max 120)' }, { status: 400 });

    const created = await (prisma as any).danmuComment.create({
        data: { chapterId, pageIndex, text: trimmed, trackY, color, userId },
        select: {
            id: true,
            pageIndex: true,
            text: true,
            trackY: true,
            color: true,
            createdAt: true,
        },
    });

    return NextResponse.json(created, { status: 201 });
}
