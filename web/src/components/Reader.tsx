'use client';

import { useState, useRef } from 'react';
import CommentsSection from './CommentsSection';

interface Page {
    id: string;
    url: string;
    width: number;
    height: number;
}

interface Chapter {
    id: string;
    title: string;
    mode: 'webtoon' | 'manga';
    pages: Page[];
}

export default function Reader({ chapter }: { chapter: Chapter }) {
    const [showOverlay, setShowOverlay] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleOverlay = () => setShowOverlay(!showOverlay);

    // Webtoon Mode: Vertical Scroll
    if (chapter.mode === 'webtoon') {
        return (
            <div
                ref={containerRef}
                className="h-full w-full overflow-y-auto scrollbar-hide relative"
                onClick={toggleOverlay}
            >
                {/* Pages */}
                <div className="flex flex-col items-center bg-black pb-20">
                    {chapter.pages.map((page) => (
                        <img
                            key={page.id}
                            src={page.url}
                            alt={`Page ${page.id}`}
                            className="w-full max-w-3xl object-contain"
                            style={{ display: 'block' }} // Gapless stitching
                            loading="lazy"
                        />
                    ))}

                    {/* Comments Section */}
                    <div className="w-full max-w-3xl px-4 mt-8" onClick={(e) => e.stopPropagation()}>
                        <CommentsSection chapterId={chapter.id} />
                    </div>
                </div>

                {/* Overlay */}
                {showOverlay && (
                    <>
                        <div className="fixed top-0 left-0 right-0 h-16 bg-black/80 text-white flex items-center px-4 z-50">
                            <h1 className="text-lg font-bold truncate">{chapter.title}</h1>
                        </div>
                        <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/80 text-white flex items-center justify-center z-50">
                            <span className="text-sm">Webtoon Mode</span>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Manga Mode: Placeholder for now
    return (
        <div className="h-full w-full flex items-center justify-center text-white">
            Manga Mode Not Implemented Yet
        </div>
    );
}
