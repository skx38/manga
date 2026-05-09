import Link from 'next/link';
import { Calendar, BookOpen, Star, Share2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { PrismaClient, Origin } from '@prisma/client';

const prisma = new PrismaClient();

// Origin badge colors mapping
const originColors = {
    JP: { bg: 'bg-red-600/20', text: 'text-red-400', border: 'border-red-600/30', label: 'Japanese' },
    KR: { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-600/30', label: 'Korean' },
    CN: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', border: 'border-yellow-600/30', label: 'Chinese' },
};

async function getComic(slugOrId: string) {
    // Try toget by slug first, fallback to ID
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

    return comic;
}

export default async function ComicDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const comic = await getComic(id);

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

    // Calculate recommendation percentage
    const totalReviews = comic.reviews.length;
    const recommendCount = comic.reviews.filter((r: any) => r.recommend).length;
    const recommendPercent = totalReviews > 0 ? Math.round((recommendCount / totalReviews) * 100) : 0;

    // Use the first chapter for the "Read First" button
    const firstChapter = comic.chapters[0];

    // Get origin badge styling
    const originStyle = originColors[comic.origin as keyof typeof originColors] || originColors.JP;

    return (
        <div className="min-h-screen bg-gray-950 pb-20">
            {/* Banner */}
            <div className="relative h-64 w-full overflow-hidden md:h-96">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent z-10" />
                <img
                    src={comic.coverImageUrl || 'https://wallpaperaccess.com/full/2374217.jpg'}
                    alt={comic.title}
                    className="h-full w-full object-cover object-center opacity-70 blur-sm"
                />
            </div>

            <div className="container mx-auto px-4 -mt-32 relative z-20">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Cover Image */}
                    <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
                        <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border-4 border-gray-900">
                            <img
                                src={comic.coverImageUrl || 'https://via.placeholder.com/400x600?text=No+Cover'}
                                alt={comic.title}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        {firstChapter && (
                            <Link href={`/reader/${firstChapter.id}`}>
                                <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2">
                                    <BookOpen size={20} />
                                    Read First Chapter
                                </button>
                            </Link>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-white">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            {/* Origin Badge */}
                            <span
                                className={`${originStyle.bg} ${originStyle.text} px-3 py-1 rounded text-xs font-bold uppercase border ${originStyle.border}`}
                            >
                                {originStyle.label}
                            </span>

                            {/* Type Badge */}
                            <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs font-bold uppercase border border-purple-600/30">
                                {comic.type}
                            </span>

                            {/* Status Badge */}
                            <span
                                className={`px-2 py-1 rounded text-xs font-bold uppercase border ${comic.status === 'COMPLETED'
                                    ? 'bg-green-600/20 text-green-400 border-green-600/30'
                                    : 'bg-orange-600/20 text-orange-400 border-orange-600/30'
                                    }`}
                            >
                                {comic.status}
                            </span>

                            {/* Recommendation % */}
                            {totalReviews > 0 && (
                                <div className="flex items-center bg-gray-800/50 px-3 py-1 rounded border border-gray-700">
                                    <ThumbsUp className="w-4 h-4 text-blue-400 mr-2 fill-current" />
                                    <span className="text-sm font-bold text-blue-400">{recommendPercent}%</span>
                                    <span className="text-xs text-gray-400 ml-1">({totalReviews})</span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{comic.title}</h1>

                        {/* Alternative Titles */}
                        {comic.altTitles && typeof comic.altTitles === 'object' && Object.keys(comic.altTitles).length > 0 && (
                            <div className="text-sm text-gray-400 mb-4">
                                {Object.entries(comic.altTitles as Record<string, string>).map(([lang, title]) => (
                                    <div key={lang}>
                                        <span className="capitalize">{lang}:</span> {title}
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="text-gray-300 leading-relaxed mb-6 max-w-3xl">{comic.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            {comic.tags.map(({ tag }: any) => (
                                <span
                                    key={tag.id}
                                    className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 cursor-pointer transition-colors"
                                >
                                    {tag.name}
                                </span>
                            ))}
                        </div>

                        {/* Chapters List */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-6">
                                Chapters <span className="text-gray-500 text-lg">({comic.chapters.length})</span>
                            </h2>
                            <div className="grid gap-2 max-h-96 overflow-y-auto">
                                {comic.chapters.map((chapter: any) => (
                                    <Link
                                        key={chapter.id}
                                        href={`/reader/${chapter.id}`}
                                        className="flex items-center justify-between p-4 rounded-lg transition-colors bg-gray-900 text-white hover:bg-gray-800"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="font-medium">{chapter.title}</span>
                                            {chapter.isLocked && (
                                                <span className="bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-bold border border-yellow-600/30">
                                                    🔒 LOCKED
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(chapter.releaseDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Reviews</h2>

                            {totalReviews === 0 ? (
                                <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-500">
                                    No reviews yet. Be the first to review!
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {comic.reviews.slice(0, 5).map((review: any) => (
                                        <div key={review.id} className="bg-gray-900 rounded-lg p-6">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-white">{review.user.username}</span>
                                                    {review.recommend ? (
                                                        <span className="flex items-center gap-1 bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-600/30">
                                                            <ThumbsUp size={12} />
                                                            Recommended
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-600/30">
                                                            <ThumbsDown size={12} />
                                                            Not Recommended
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {review.comment && <p className="text-gray-300 leading-relaxed">{review.comment}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
