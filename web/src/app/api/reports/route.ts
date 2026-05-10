import { NextResponse } from 'next/server';
import { PrismaClient, ReportReason, ReportStatus } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { rateLimit } from '@/lib/rateLimit';
import { getModeratedComics } from '@/lib/permissions';

const prisma = new PrismaClient();

const VALID_REASONS: ReportReason[] = ['SPAM', 'HARASSMENT', 'NSFW', 'SPOILER', 'OTHER'];

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const limit = rateLimit(userId, 'report.create', 5, 60_000);
        if (!limit.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

        const body = await request.json();
        const { postId, commentId, reason, details } = body;

        if (!postId && !commentId) {
            return NextResponse.json({ error: 'Missing postId or commentId' }, { status: 400 });
        }
        if (!VALID_REASONS.includes(reason)) {
            return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
        }

        const report = await prisma.report.create({
            data: {
                reporterId: userId,
                postId: postId ?? null,
                commentId: commentId ?? null,
                reason,
                details: details?.toString().slice(0, 500),
            },
        });
        return NextResponse.json(report, { status: 201 });
    } catch (error) {
        console.error('Error filing report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * Mods see reports for any comic they moderate. Optionally filter by ?comicId=…
 * or ?status=OPEN|RESOLVED|DISMISSED.
 */
export async function GET(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const moderated = await getModeratedComics(userId);
        if (moderated.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const comicId = searchParams.get('comicId');
        const status = searchParams.get('status') as ReportStatus | null;

        const allowedComicIds = comicId
            ? (moderated.includes(comicId) ? [comicId] : [])
            : moderated;
        if (allowedComicIds.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const where: any = {
            OR: [
                { post: { comicId: { in: allowedComicIds } } },
                { comment: { post: { comicId: { in: allowedComicIds } } } },
            ],
        };
        if (status) where.status = status;

        const reports = await prisma.report.findMany({
            where,
            include: {
                reporter: { select: { id: true, username: true } },
                post: { select: { id: true, title: true, comicId: true } },
                comment: { select: { id: true, content: true, postId: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        return NextResponse.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/** Mod resolves or dismisses a report. */
export async function PATCH(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, status } = await request.json();
        if (!id || !['RESOLVED', 'DISMISSED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const report = await prisma.report.findUnique({
            where: { id },
            include: {
                post: { select: { comicId: true } },
                comment: { select: { post: { select: { comicId: true } } } },
            },
        });
        if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const comicId = report.post?.comicId ?? report.comment?.post?.comicId;
        if (!comicId) return NextResponse.json({ error: 'Orphaned report' }, { status: 400 });

        const moderated = await getModeratedComics(userId);
        if (!moderated.includes(comicId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updated = await prisma.report.update({
            where: { id },
            data: { status, resolvedById: userId, resolvedAt: new Date() },
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error resolving report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
