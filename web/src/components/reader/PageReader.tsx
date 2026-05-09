'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReaderStore } from '@/store/readerStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DanmuOverlay from './DanmuOverlay';

interface Page {
    id: string;
    imageUrl: string;
    width?: number;
    height?: number;
}

interface PageReaderProps {
    pages: Page[];
    chapterId?: string;
    onNextChapter?: () => void;
    onPrevChapter?: () => void;
    onPageChange?: (pageIndex: number) => void;
}

export default function PageReader({ pages, chapterId, onNextChapter, onPrevChapter, onPageChange }: PageReaderProps) {
    const { direction, fitMode, zoom, doublePage, danmuEnabled } = useReaderStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [danmuInputFocused, setDanmuInputFocused] = useState(false);

    // Reset index when pages change (new chapter)
    useEffect(() => {
        setCurrentIndex(0);
        onPageChange?.(0);
    }, [pages, onPageChange]);

    const isRTL = direction === 'RTL';

    const goToNext = useCallback(() => {
        const increment = doublePage ? 2 : 1;
        if (currentIndex + increment < pages.length) {
            const newIndex = currentIndex + increment;
            setCurrentIndex(newIndex);
            onPageChange?.(newIndex);
        } else if (currentIndex < pages.length - 1 && doublePage) {
            // If we are at the second to last page in double mode, go to last page
            const newIndex = pages.length - 1;
            setCurrentIndex(newIndex);
            onPageChange?.(newIndex);
        } else if (onNextChapter) {
            onNextChapter();
        }
    }, [currentIndex, pages.length, onNextChapter, doublePage, onPageChange]);

    const goToPrev = useCallback(() => {
        const decrement = doublePage ? 2 : 1;
        if (currentIndex - decrement >= 0) {
            const newIndex = currentIndex - decrement;
            setCurrentIndex(newIndex);
            onPageChange?.(newIndex);
        } else if (currentIndex > 0 && doublePage) {
            setCurrentIndex(0);
            onPageChange?.(0);
        } else if (onPrevChapter) {
            onPrevChapter();
        }
    }, [currentIndex, onPrevChapter, doublePage, onPageChange]);

    // Keyboard navigation (disabled while typing a danmu)
    useEffect(() => {
        if (danmuInputFocused) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                isRTL ? goToPrev() : goToNext();
            } else if (e.key === 'ArrowLeft') {
                isRTL ? goToNext() : goToPrev();
            } else if (e.key === ' ') {
                e.preventDefault();
                goToNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrev, isRTL, danmuInputFocused]);

    const getImageStyle = (page: Page) => {
        const baseStyle: React.CSSProperties = {};

        if (doublePage) {
            baseStyle.maxWidth = '50%';
            baseStyle.maxHeight = '100vh';
            baseStyle.objectFit = 'contain';
            return baseStyle;
        }

        switch (fitMode) {
            case 'WIDTH':
                return { width: `${zoom}%`, height: 'auto', maxHeight: 'none' };
            case 'HEIGHT':
                return { height: `${zoom}vh`, width: 'auto', maxWidth: 'none' };
            case 'ORIGINAL':
                return {
                    width: page.width ? `${page.width * (zoom / 100)}px` : 'auto',
                    maxWidth: 'none',
                    maxHeight: 'none'
                };
            default:
                return { maxHeight: `${zoom}vh`, maxWidth: `${zoom}%` };
        }
    };

    const currentPage = pages[currentIndex];
    const nextPage = doublePage && currentIndex + 1 < pages.length ? pages[currentIndex + 1] : null;

    if (!currentPage) return null;

    return (
        <div className="fixed inset-0 z-0 overflow-auto flex items-center justify-center">
            {/* Navigation Zones (Invisible) */}
            <div
                className="fixed inset-y-0 left-0 w-1/4 z-10 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={isRTL ? goToNext : goToPrev}
                title={isRTL ? "Next Page" : "Previous Page"}
            />
            <div
                className="fixed inset-y-0 right-0 w-1/4 z-10 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={isRTL ? goToPrev : goToNext}
                title={isRTL ? "Previous Page" : "Next Page"}
            />

            {/* Main Image Container */}
            <div className={`relative z-0 min-w-full min-h-full flex items-center justify-center p-4 gap-0 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <img
                    src={currentPage.imageUrl}
                    alt={`Page ${currentIndex + 1}`}
                    style={getImageStyle(currentPage)}
                    className="object-contain shadow-2xl"
                />
                {doublePage && nextPage && (
                    <img
                        src={nextPage.imageUrl}
                        alt={`Page ${currentIndex + 2}`}
                        style={getImageStyle(nextPage)}
                        className="object-contain shadow-2xl"
                    />
                )}

                {/* Danmu overlay (per-page) */}
                {chapterId && (
                    <DanmuOverlay
                        chapterId={chapterId}
                        pageIndex={currentIndex}
                        enabled={danmuEnabled}
                        onInputFocusChange={setDanmuInputFocused}
                    />
                )}
            </div>

            {/* Page Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-1 rounded-full text-white text-sm font-medium z-20">
                Page {currentIndex + 1}{doublePage && nextPage ? `-${currentIndex + 2}` : ''} / {pages.length}
            </div>

            {/* Navigation Hints */}
            <div className="absolute top-1/2 left-4 -translate-y-1/2 text-white/30 pointer-events-none">
                <ChevronLeft size={48} />
            </div>
            <div className="absolute top-1/2 right-4 -translate-y-1/2 text-white/30 pointer-events-none">
                <ChevronRight size={48} />
            </div>
        </div>
    );
}
