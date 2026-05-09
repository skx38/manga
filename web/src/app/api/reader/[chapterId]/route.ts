import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: Request,
    { params }: { params: Promise<{ chapterId: string }> }
) {
    try {
        const { chapterId } = await params;

        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: {
                pages: {
                    orderBy: {
                        orderIndex: 'asc',
                    },
                },
                comic: true,
            },
        });

        if (!chapter) {
            return NextResponse.json(
                { error: 'Chapter not found' },
                { status: 404 }
            );
        }

        // Determine reading mode based on comic type
        const mode = chapter.comic.type.toLowerCase() === 'webtoon' ? 'webtoon' : 'manga';

        return NextResponse.json({
            id: chapter.id,
            title: chapter.title,
            number: chapter.number,
            mode: mode,
            pages: chapter.pages.map((page) => ({
                id: page.id,
                url: page.imageUrl,
                width: page.width,
                height: page.height,
            })),
            nextChapterId: null, // TODO: Implement logic to find next chapter
            prevChapterId: null, // TODO: Implement logic to find prev chapter
        });
    } catch (error) {
        console.error('Error fetching chapter:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
