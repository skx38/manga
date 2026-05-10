import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const comicId = searchParams.get('comicId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 10;
        const skip = (page - 1) * limit;

        if (!comicId) {
            return NextResponse.json({ error: 'Missing comicId' }, { status: 400 });
        }

        // Fetch reviews with pagination
        const reviews = await prisma.review.findMany({
            where: { comicId },
            include: {
                user: { select: { username: true, id: true } },
                reactions: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
        });

        // Get aggregate stats
        const totalReviews = await prisma.review.count({ where: { comicId } });
        const positiveReviews = await prisma.review.count({
            where: { comicId, recommend: true },
        });

        const positivePercent = totalReviews > 0
            ? Math.round((positiveReviews / totalReviews) * 100)
            : 0;

        // Transform reviews to include grouped reaction counts
        const transformedReviews = reviews.map((review: any) => {
            const reactionCounts: Record<string, number> = {};
            review.reactions.forEach((r: any) => {
                reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
            });

            return {
                ...review,
                reactionCounts
            };
        });

        return NextResponse.json({
            reviews: transformedReviews,
            stats: {
                total: totalReviews,
                positive: positiveReviews,
                negative: totalReviews - positiveReviews,
                percent: positivePercent,
            },
            hasMore: skip + reviews.length < totalReviews,
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { comicId, userId, recommend, comment } = body;

        if (!comicId || !userId || recommend === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure user exists (Mock User Fix)
        if (!userId) {
            await prisma.user.upsert({
                where: { id: userId },
                update: {},
                create: {
                    id: userId,
                    username: 'Demo User',
                    email: 'demo_review_user@example.com',
                }
            });
        }

        // Ensure comic exists (for Comick API comics not yet in DB)
        if (body.comicTitle) {
            await prisma.comic.upsert({
                where: { id: comicId },
                update: {}, // Don't overwrite if exists
                create: {
                    id: comicId,
                    title: body.comicTitle,
                    coverImageUrl: body.coverImageUrl,
                    slug: comicId, // Use ID as slug for now if not provided
                    origin: 'JP', // Default or need to pass this too? Let's assume JP or pass it.
                    type: body.comicType || 'manga',
                }
            });
        }

        // Upsert review (create or update if exists)
        const review = await prisma.review.upsert({
            where: {
                userId_comicId: {
                    userId,
                    comicId,
                },
            },
            update: {
                recommend,
                comment,
            },
            create: {
                userId,
                comicId,
                recommend,
                comment,
            },
        });

        return NextResponse.json(review, { status: 200 });
    } catch (error) {
        console.error('Error submitting review:', error);
        return NextResponse.json({ error: `Internal Server Error: ${(error as Error).message}` }, { status: 500 });
    }
}
