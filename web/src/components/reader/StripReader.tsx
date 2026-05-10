'use client';

import { useEffect, useRef, useState } from 'react';
import { useReaderStore } from '@/store/readerStore';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';

interface Page {
    id: string;
    imageUrl: string;
    width?: number;
    height?: number;
}

interface StripReaderProps {
    pages: Page[];
    prevChapterId?: string;
    prevChapterTitle?: string;
    nextChapterId?: string;
    nextChapterTitle?: string;
}

const PREFETCH_AHEAD = 5;

export default function StripReader({
    pages,
    prevChapterId,
    prevChapterTitle,
    nextChapterId,
    nextChapterTitle,
}: StripReaderProps) {
    const { fitMode, zoom, einkMode } = useReaderStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [loaded, setLoaded] = useState<Set<number>>(new Set([0, 1, 2]));

    // IntersectionObserver: when page N enters viewport, mark N+1..N+5 for load
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const idx = Number((entry.target as HTMLElement).dataset.idx);
                        setLoaded(prev => {
                            const next = new Set(prev);
                            for (let i = idx; i <= idx + PREFETCH_AHEAD && i < pages.length; i++) {
                                next.add(i);
                            }
                            return next;
                        });
                    }
                });
            },
            { rootMargin: '200px 0px' }
        );

        const items = containerRef.current?.querySelectorAll('[data-idx]') ?? [];
        items.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [pages.length]);

    const getContainerClass = () => {
        switch (fitMode) {
            case 'WIDTH':    return 'w-full max-w-4xl mx-auto';
            case 'HEIGHT':   return 'h-screen w-auto mx-auto flex flex-col items-center';
            case 'ORIGINAL': return 'w-auto mx-auto';
            default:         return 'w-full max-w-4xl mx-auto';
        }
    };

    const getImageStyle = (page: Page): React.CSSProperties => {
        switch (fitMode) {
            case 'WIDTH':    return { width: `${zoom}%`, height: 'auto', maxWidth: 'none' };
            case 'HEIGHT':   return { height: `${zoom}vh`, width: 'auto', maxWidth: 'none' };
            case 'ORIGINAL': return { width: page.width ? `${page.width * (zoom / 100)}px` : 'auto', maxWidth: 'none' };
            default:         return { width: `${zoom}%`, height: 'auto' };
        }
    };

    return (
        <div
            ref={containerRef}
            className={`min-h-screen pb-20 ${getContainerClass()} ${einkMode ? 'eink-mode' : ''}`}
        >
            {pages.map((page, index) => (
                <div key={page.id} className="relative flex justify-center" data-idx={index}>
                    {loaded.has(index) ? (
                        <img
                            src={page.imageUrl}
                            alt={`Page ${index + 1}`}
                            style={getImageStyle(page)}
                            className="block"
                            loading={index < 3 ? 'eager' : 'lazy'}
                        />
                    ) : (
                        /* Placeholder while image hasn't been scheduled yet */
                        <div
                            style={{ ...getImageStyle(page), minHeight: 400, backgroundColor: 'hsl(var(--muted))' }}
                            className="block animate-pulse"
                            aria-hidden
                        />
                    )}
                </div>
            ))}

            {/* End-of-chapter split bar */}
            <div className="py-10 w-full">
                <div className="flex w-full h-24 border-t border-b border-border bg-card/50">
                    {prevChapterId && (
                        <Link
                            href={`/reader/${prevChapterId}`}
                            className="w-[30%] flex items-center justify-between px-4 md:px-8 hover:bg-accent transition-colors border-r border-border group"
                        >
                            <ArrowLeft size={22} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            <div className="text-right hidden sm:block">
                                <span className="block text-base font-bold group-hover:text-brand transition-colors">Prev</span>
                                <span className="block text-xs text-muted-foreground truncate max-w-[100px]">{prevChapterTitle || 'Previous'}</span>
                            </div>
                        </Link>
                    )}
                    {nextChapterId ? (
                        <Link
                            href={`/reader/${nextChapterId}`}
                            className={`${prevChapterId ? 'w-[70%]' : 'w-full'} flex items-center justify-between px-4 md:px-8 hover:bg-accent transition-colors group`}
                        >
                            <div>
                                <span className="block text-base font-bold group-hover:text-brand transition-colors">Next Chapter</span>
                                <span className="block text-xs text-muted-foreground">{nextChapterTitle || 'Next'}</span>
                            </div>
                            <ArrowRight size={22} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>
                    ) : (
                        <Link
                            href="/"
                            className={`${prevChapterId ? 'w-[70%]' : 'w-full'} flex items-center justify-center gap-2 hover:bg-accent transition-colors group`}
                        >
                            <Home size={22} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            <span className="text-base font-bold group-hover:text-success transition-colors">Back to Home</span>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
