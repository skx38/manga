import { PrismaClient, Origin, Status, ContentRating } from '@prisma/client';
import FilterPanel from '@/components/search/FilterPanel';
import ComicCard from '@/components/ComicCard';

const prisma = new PrismaClient();

// Force dynamic rendering for search results
export const dynamic = 'force-dynamic';

async function getTags() {
    return prisma.tag.findMany({
        orderBy: { name: 'asc' },
    });
}

async function getComics(searchParams: { [key: string]: string | string[] | undefined }) {
    const type = searchParams.type as string;
    const pubStatusParam = (searchParams.pubStatus as string)?.split(',').filter(Boolean) as Status[] | undefined;
    const contentParam = (searchParams.content as string)?.split(',').filter(Boolean) as ContentRating[] | undefined;
    const chaptersParam = searchParams.chapters ? parseInt(searchParams.chapters as string) : undefined;
    const fromParam = searchParams.from as string;
    const toParam = searchParams.to as string;

    const search = searchParams.search as string;
    const includedTags = (searchParams.included as string)?.split(',').filter(Boolean).map(Number) || [];
    const excludedTags = (searchParams.excluded as string)?.split(',').filter(Boolean).map(Number) || [];
    const originsParam = (searchParams.origins as string)?.split(',').filter(Boolean) as Origin[] | undefined;
    const sort = (searchParams.sort as string) || 'latest';

    const where: any = {};

    if (type) where.type = type;
    if (pubStatusParam && pubStatusParam.length > 0) where.status = { in: pubStatusParam };
    if (contentParam && contentParam.length > 0) where.contentRating = { in: contentParam };
    if (originsParam && originsParam.length > 0) where.origin = { in: originsParam };
    if (chaptersParam !== undefined) where.chapterCount = { gte: chaptersParam };

    if (fromParam || toParam) {
        where.publishedAt = {};
        if (fromParam) where.publishedAt.gte = new Date(fromParam);
        if (toParam) where.publishedAt.lte = new Date(toParam);
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (includedTags.length > 0 || excludedTags.length > 0) {
        where.AND = [];
        if (includedTags.length > 0) {
            includedTags.forEach((tagId) => {
                where.AND.push({ tags: { some: { tagId } } });
            });
        }
        if (excludedTags.length > 0) {
            where.AND.push({ tags: { none: { tagId: { in: excludedTags } } } });
        }
    }

    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
        case 'popular': orderBy = { views: 'desc' }; break;
        case 'oldest': orderBy = { createdAt: 'asc' }; break;
        case 'rating': orderBy = { rating: 'desc' }; break;
        case 'title': orderBy = { title: 'asc' }; break;
        case 'latest': default: orderBy = { createdAt: 'desc' };
    }

    const comics = await prisma.comic.findMany({
        where,
        include: {
            tags: { include: { tag: true } },
            _count: { select: { chapters: true, reviews: true } },
        },
        orderBy,
    });

    return comics.map(c => ({
        ...c,
        coverUrl: c.coverImageUrl || '/placeholder-cover.png',
    }));
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const [tags, comics] = await Promise.all([
        getTags(),
        getComics(resolvedParams),
    ]);

    // Fetch library status for current user
    const userId = 'demo_user_id';
    const libraryEntries = await prisma.libraryEntry.findMany({
        where: { userId },
        select: { comicId: true, status: true }
    });
    const libraryMap = new Map(libraryEntries.map(e => [e.comicId, e.status]));

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 py-8">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-2">Advanced Search</h1>
                    <p className="text-gray-400">
                        Find your next favorite story using our powerful discovery tools.
                    </p>
                </div>
            </div>

            {/* Filter Panel */}
            <FilterPanel availableTags={tags} />

            {/* Results */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">
                        Results <span className="text-gray-500 text-base font-normal ml-2">({comics.length})</span>
                    </h2>
                </div>

                {comics.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-gray-800 rounded-xl">
                        <p className="text-xl text-gray-400 mb-2">No comics found</p>
                        <p className="text-gray-600">Try adjusting your filters to find what you're looking for.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {comics.map((comic) => (
                            <ComicCard
                                key={comic.id}
                                id={comic.id}
                                title={comic.title}
                                coverUrl={comic.coverUrl}
                                type={comic.type}
                                rating={comic.rating}
                                currentStatus={libraryMap.get(comic.id) || null}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
