'use client';

import { useEffect, useRef } from 'react';
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

export default function StripReader({
    pages,
    prevChapterId,
    prevChapterTitle,
    nextChapterId,
    nextChapterTitle
}: StripReaderProps) {
    const { fitMode, zoom } = useReaderStore();
    const containerRef = useRef<HTMLDivElement>(null);

    // Determine container width based on fit mode
    const getContainerStyle = () => {
        switch (fitMode) {
            case 'WIDTH':
                return 'w-full max-w-4xl mx-auto';
            case 'HEIGHT':
                return 'h-screen w-auto mx-auto flex flex-col items-center';
            case 'ORIGINAL':
                return 'w-auto mx-auto';
            default:
                return 'w-full max-w-4xl mx-auto';
        }
    };

    const getImageStyle = (page: Page) => {
        switch (fitMode) {
            case 'WIDTH':
                return { width: `${zoom}%`, height: 'auto', maxWidth: 'none' };
            case 'HEIGHT':
                return { height: `${zoom}vh`, width: 'auto', maxWidth: 'none' };
            case 'ORIGINAL':
                return {
                    width: page.width ? `${page.width * (zoom / 100)}px` : 'auto',
                    maxWidth: 'none'
                };
            default:
                return { width: `${zoom}%`, height: 'auto' };
        }
    };

    return (
        <div
            ref={containerRef}
            className={`min-h-screen pb-20 ${getContainerStyle()}`}
        >
            {pages.map((page, index) => (
                <div key={page.id} className="relative flex justify-center">
                    <img
                        src={page.imageUrl}
                        alt={`Page ${index + 1}`}
                        style={getImageStyle(page)}
                        className="block"
                        loading="lazy"
                    />
                </div>
            ))}

            {/* End of Chapter Navigation (Split Bar Design) */}
            <div className="py-10 w-full">
                <div className="flex w-full h-24 border-t border-b border-gray-800 bg-gray-900/50">

                    {/* Previous Chapter (30% if exists) */}
                    {prevChapterId && (
                        <Link
                            href={`/reader/${prevChapterId}`}
                            className="w-[30%] flex items-center justify-between px-4 md:px-8 hover:bg-gray-800 transition-colors border-r border-gray-800 group"
                        >
                            <ArrowLeft size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                            <div className="text-right hidden sm:block">
                                <span className="block text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Prev</span>
                                <span className="block text-sm text-gray-500 truncate max-w-[100px]">{prevChapterTitle || 'Previous'}</span>
                            </div>
                        </Link>
                    )}

                    {/* Next Chapter (70% or 100%) */}
                    {nextChapterId ? (
                        <Link
                            href={`/reader/${nextChapterId}`}
                            className={`${prevChapterId ? 'w-[70%]' : 'w-full'} flex items-center justify-between px-4 md:px-8 hover:bg-gray-800 transition-colors group`}
                        >
                            <div className="text-left">
                                <span className="block text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Next Chapter</span>
                                <span className="block text-sm text-gray-500">{nextChapterTitle || 'Next'}</span>
                            </div>
                            <ArrowRight size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                        </Link>
                    ) : (
                        <Link
                            href="/"
                            className={`${prevChapterId ? 'w-[70%]' : 'w-full'} flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors group`}
                        >
                            <Home size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                            <span className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">Home</span>
                        </Link>
                    )}

                </div>
            </div>
        </div>
    );
}
