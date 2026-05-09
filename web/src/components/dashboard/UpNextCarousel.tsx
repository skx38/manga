'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, ChevronRight } from 'lucide-react';
import ComicCard from '../ComicCard';

interface UpNextItem {
    comic: {
        id: string;
        title: string;
        coverImageUrl: string;
        slug: string;
    };
    nextChapter: {
        id: string;
        number: number;
        title: string;
    };
    progress: {
        chapterNumber: number;
        percentage: number;
    } | null;
}

export default function UpNextCarousel() {
    const [items, setItems] = useState<UpNextItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/library/up-next')
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch Up Next:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return null;
    if (items.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6 px-4 md:px-0">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Play className="fill-current text-blue-500" size={24} />
                    Continue Reading
                </h2>
                <Link href="/library" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    View Library <ChevronRight size={16} />
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 px-4 md:px-0">
                {items.map((item) => (
                    <div key={item.comic.id} className="relative group">
                        <ComicCard
                            id={item.comic.id}
                            title={item.comic.title}
                            coverUrl={item.comic.coverImageUrl || '/placeholder-cover.png'}
                            type="MANGA" // Default or fetch if needed
                            rating={8.5} // Default or fetch if needed
                            currentStatus="READING"
                            readerUrl={`/reader/${item.nextChapter.id}`} // Activates split-click behavior
                        />

                        {/* "Up Next" Badge (Visual only, click handled by card top) */}
                        <div className="absolute top-2 left-2 z-20 pointer-events-none">
                            <div className="flex items-center gap-1 bg-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-lg border border-blue-400/30">
                                <Play size={10} className="fill-current" />
                                <span>Ch. {item.nextChapter.number}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
