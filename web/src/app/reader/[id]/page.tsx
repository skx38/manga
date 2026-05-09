import ReaderContainer from '@/components/reader/ReaderContainer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getChapterData(id: string) {
    const chapter = await prisma.chapter.findUnique({
        where: { id },
        include: {
            pages: { orderBy: { orderIndex: 'asc' } },
            comic: {
                include: {
                    chapters: {
                        select: { id: true, number: true, title: true },
                        orderBy: { number: 'asc' },
                    },
                },
            },
        },
    });

    if (!chapter) return null;

    // Find prev/next chapters
    const chapters = chapter.comic.chapters;
    const currentIndex = chapters.findIndex((c) => c.id === chapter.id);
    const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

    return {
        chapter,
        allChapters: chapters,
        prevChapterId: prevChapter?.id,
        prevChapterTitle: prevChapter ? `Ch. ${prevChapter.number}` : undefined,
        nextChapterId: nextChapter?.id,
        nextChapterTitle: nextChapter ? `Ch. ${nextChapter.number}` : undefined,
    };
}

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getChapterData(id);

    if (!data) {
        return <div className="text-white text-center py-20">Chapter not found</div>;
    }

    const { chapter, allChapters, prevChapterId, prevChapterTitle, nextChapterId, nextChapterTitle } = data;

    return (
        <ReaderContainer
            comicId={chapter.comicId}
            comicTitle={chapter.comic.title}
            coverImageUrl={chapter.comic.coverImageUrl}
            chapterId={chapter.id}
            chapterTitle={`${chapter.comic.title} - ${chapter.title}`}
            chapterNumber={chapter.number}
            allChapters={allChapters}
            currentLikes={(chapter as any).likes || 0}
            pages={chapter.pages.map((p) => ({
                id: p.id,
                imageUrl: p.imageUrl,
                width: p.width,
                height: p.height,
            }))}
            prevChapterId={prevChapterId}
            prevChapterTitle={prevChapterTitle}
            nextChapterId={nextChapterId}
            nextChapterTitle={nextChapterTitle}
        />
    );
}
