import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, BookOpen, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';


export default async function HistoryPage() {
    const userId = 'demo_user_id';

    const history = await prisma.readingProgress.findMany({
        where: { userId },
        include: {
            chapter: {
                include: {
                    comic: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            coverImageUrl: true,
                            type: true,
                        }
                    }
                }
            }
        },
        orderBy: { lastRead: 'desc' },
        take: 50
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-8">
                <Clock className="w-8 h-8 text-blue-500" />
                <h1 className="text-3xl font-bold text-white">Reading History</h1>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-gray-800">
                    <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-400 mb-2">No history yet</h2>
                    <p className="text-gray-500 mb-6">Start reading some comics to see them here!</p>
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                    >
                        Browse Comics
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.map((item) => {
                        const comic = item.chapter.comic;
                        return (
                            <div key={`${item.chapterId}-${item.lastRead}`} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors flex group">
                                {/* Cover Image */}
                                <Link href={`/comic/${comic.slug}`} className="w-24 relative flex-shrink-0">
                                    <Image
                                        src={comic.coverImageUrl || '/placeholder-cover.svg'}
                                        alt={comic.title}
                                        fill
                                        className="object-cover"
                                    />
                                </Link>

                                {/* Content */}
                                <div className="flex-1 p-4 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                                                {comic.type}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatDistanceToNow(new Date(item.lastRead))} ago
                                            </span>
                                        </div>
                                        <Link href={`/comic/${comic.slug}`} className="font-bold text-white line-clamp-1 hover:text-blue-400 transition-colors mb-1">
                                            {comic.title}
                                        </Link>
                                        <div className="text-sm text-gray-400">
                                            Last read: <span className="text-white font-medium">Chapter {item.chapter.number}</span>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/comic/${comic.slug}/read/${item.chapter.number}`}
                                        className="mt-3 flex items-center justify-between bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors group-hover:bg-blue-600 group-hover:text-white"
                                    >
                                        Continue Reading
                                        <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
