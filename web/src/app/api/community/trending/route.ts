import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Group posts by comicId and count them
        const trending = await prisma.post.groupBy({
            by: ['comicId'],
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            _count: {
                comicId: true
            },
            orderBy: {
                _count: {
                    comicId: 'desc'
                }
            },
            take: 5
        });

        // Fetch comic details for these IDs
        const trendingComics = await Promise.all(trending.map(async (item) => {
            const comic = await prisma.comic.findUnique({
                where: { id: item.comicId },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImageUrl: true
                }
            });
            return {
                ...comic,
                postCount: item._count.comicId
            };
        }));

        // Filter out any nulls (in case comic was deleted but posts remain?)
        const validTrending = trendingComics.filter(c => c && c.id);

        return NextResponse.json(validTrending);
    } catch (error) {
        console.error('Error fetching trending communities:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
