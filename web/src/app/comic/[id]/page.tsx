import Link from 'next/link';
import Image from 'next/image';

import { Calendar, BookOpen, ThumbsUp, ThumbsDown } from 'lucide-react';
import { PrismaClient } from '@prisma/client';
import ComicHeader from '@/components/comic/ComicHeader';
import ComicInfo from '@/components/comic/ComicInfo';
import ComicTabs from '@/components/comic/ComicTabs';
import Recommendations from '@/components/comic/Recommendations';
import { getSimilarComics } from '@/lib/recommendations';

const prisma = new PrismaClient();

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

async function getData(slugOrId: string) {
    const userId = 'demo_user_id'; // Hardcoded for now

    // 1. Fetch Comic with all relations
    let comic = await (prisma.comic as any).findUnique({
        where: { slug: slugOrId },
        include: {
            tags: { include: { tag: true } },
            chapters: { orderBy: { number: 'asc' } },
            reviews: {
                include: { user: { select: { username: true } } },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!comic) {
        comic = await (prisma.comic as any).findUnique({
            where: { id: slugOrId },
            include: {
                tags: { include: { tag: true } },
                chapters: { orderBy: { number: 'asc' } },
                reviews: {
                    include: { user: { select: { username: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    if (!comic) return { comic: null, folders: [], continueChapter: null, similarComics: [] };

    // 2. Fetch User's Library Status
    const libraryEntry = await (prisma as any).libraryEntry.findUnique({
        where: { userId_comicId: { userId, comicId: comic.id } }
    });

    // 3. Fetch User's Folders (and check which ones contain this comic)
    const folders = await (prisma as any).folder.findMany({
        where: { userId },
        include: { comics: true },
        orderBy: { order: 'asc' }
    });

    const comicFolderIds = folders
        .filter((f: any) => f.comics.some((fc: any) => fc.comicId === comic.id))
        .map((f: any) => f.id);

    // 4. Fetch Reading Progress (Last read chapter)
    const progress = await prisma.readingProgress.findFirst({
        where: { userId, chapter: { comicId: comic.id } },
        orderBy: { lastRead: 'desc' },
        include: { chapter: true }
    });

    let continueChapter = progress?.chapter;

    // Smart Continue: If > 90% read, go to next chapter
    if (progress && progress.scrollPercentage > 0.9) {
        const currentChapterIndex = comic.chapters.findIndex((c: any) => c.id === progress.chapterId);
        if (currentChapterIndex !== -1 && currentChapterIndex < comic.chapters.length - 1) {
            continueChapter = comic.chapters[currentChapterIndex + 1];
        }
    }

    // 5. Calculate Rank (by followers)
    const followersCount = await prisma.libraryEntry.count({
        where: { comicId: comic.id }
    });

    const rankResult = await prisma.$queryRaw`
        SELECT COUNT(*) as rank
        FROM (
            SELECT "comicId", COUNT(*) as count
            FROM "LibraryEntry"
            GROUP BY "comicId"
        ) as counts
        WHERE count > ${followersCount}
    `;

    const rank = Number((rankResult as any)[0]?.rank || 0) + 1;

    // 6. Fetch Similar Comics
    const similarComics = await getSimilarComics(comic.id);

    return {
        comic: {
            ...comic,
            myStatus: libraryEntry?.status || null,
            myRating: libraryEntry?.score || 0,
            folderIds: comicFolderIds,
            followersCount,
            rank
        },
        folders,
        continueChapter,
        similarComics
    };
}

export default async function ComicDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { comic, folders, continueChapter, similarComics } = await getData(id);

    if (!comic) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">Comic Not Found</h1>
                    <Link href="/" className="text-blue-400 hover:text-blue-300">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const firstChapter = comic.chapters[0];

    return (
        <div className="min-h-screen bg-gray-950 pb-20">
            {/* Banner */}
            <div className="relative h-64 w-full overflow-hidden md:h-80">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent z-10" />
                <Image
                    src={comic.coverImageUrl || '/placeholder-cover.svg'}
                    alt={comic.title}
                    fill
                    className="object-cover object-center opacity-40 blur-sm"
                    priority
                />
            </div>

            <div className="container mx-auto px-4 -mt-48 relative z-20">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Column: Cover */}
                    <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
                        <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border-4 border-gray-900 mb-6 relative">
                            <Image
                                src={comic.coverImageUrl || '/placeholder-cover.svg'}
                                alt={comic.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 192px, 256px"
                                priority
                            />
                        </div>
                    </div>

                    {/* Right Column: Info */}
                    <div className="flex-1">
                        <ComicHeader
                            comic={comic}
                            folders={folders}
                            firstChapterId={firstChapter?.id}
                            lastReadChapterId={continueChapter?.id}
                            lastReadChapterNumber={continueChapter?.number}
                        />

                        <ComicInfo comic={comic} />

                        <ComicTabs
                            comicId={comic.id}
                            comicTitle={comic.title}
                            coverImageUrl={comic.coverImageUrl || ''}
                            comicType={comic.type}
                            chapters={comic.chapters}
                            reviews={comic.reviews}
                        />

                        <Recommendations comics={similarComics} />
                    </div>
                </div>
            </div>
        </div>
    );
}
