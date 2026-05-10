import { NextResponse } from 'next/server';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { rating } = await request.json(); // rating is 1-10 (or 1-5, let's assume 1-10 for precision, displayed as 5 stars)
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (typeof rating !== 'number' || rating < 0 || rating > 10) {
            return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
        }

        // 1. Update User's Library Entry Score
        // If entry doesn't exist, create it with default status (e.g., PLAN_TO_READ or just exist?)
        // Usually you rate something you've read. Let's assume we upsert.
        await prisma.libraryEntry.upsert({
            where: {
                userId_comicId: {
                    userId,
                    comicId: id
                }
            },
            update: {
                score: rating
            },
            create: {
                userId,
                comicId: id,
                status: 'READING', // Default if rating without status
                score: rating
            }
        });

        // 2. Recalculate Average Rating for Comic
        const aggregations = await prisma.libraryEntry.aggregate({
            where: { comicId: id, score: { not: null } },
            _avg: { score: true },
            _count: { score: true }
        });

        const newAverage = aggregations._avg.score || 0;

        // 3. Update Comic
        const updatedComic = await prisma.comic.update({
            where: { id },
            data: { rating: newAverage }
        });

        return NextResponse.json({
            success: true,
            rating: newAverage,
            myRating: rating,
            count: aggregations._count.score
        });

    } catch (error) {
        console.error('Failed to rate comic:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
