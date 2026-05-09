import { NextResponse } from 'next/server';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Get all comics the user is currently reading
        const readingEntries = await (prisma as any).libraryEntry.findMany({
            where: {
                userId,
                status: 'READING'
            },
            include: {
                comic: {
                    include: {
                        chapters: {
                            orderBy: { number: 'asc' }
                        }
                    }
                }
            }
        });

        const upNext = [];

        for (const entry of readingEntries) {
            const comic = entry.comic;

            // 2. Get the user's last read chapter for this comic
            const lastProgress = await prisma.readingProgress.findFirst({
                where: {
                    userId,
                    chapter: { comicId: comic.id }
                },
                orderBy: { lastRead: 'desc' },
                include: { chapter: true }
            });

            let nextChapter = null;

            if (!lastProgress) {
                // If no progress, start with the first chapter
                nextChapter = comic.chapters[0];
            } else {
                // Find the first chapter with a number greater than the last read chapter
                nextChapter = comic.chapters.find((c: any) => c.number > lastProgress.chapter.number);
            }

            if (nextChapter) {
                upNext.push({
                    comic: {
                        id: comic.id,
                        title: comic.title,
                        coverImageUrl: comic.coverImageUrl,
                        slug: comic.slug
                    },
                    nextChapter: {
                        id: nextChapter.id,
                        number: nextChapter.number,
                        title: nextChapter.title
                    },
                    progress: lastProgress ? {
                        chapterNumber: lastProgress.chapter.number,
                        percentage: lastProgress.scrollPercentage || 0
                    } : null
                });
            }
        }

        return NextResponse.json(upNext);

    } catch (error) {
        console.error('Error fetching Up Next queue:', error);
        return NextResponse.json({ error: 'Failed to fetch Up Next queue' }, { status: 500 });
    }
}
