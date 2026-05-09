'use client';

import { useEffect, useState } from 'react';
import { useReaderStore } from '@/store/readerStore';
import StripReader from './StripReader';
import PageReader from './PageReader';
import ReaderSettings from './ReaderSettings';
import CommentSection from './CommentSection';
import { Settings, ArrowLeft, Minus, Plus, ChevronLeft, ChevronRight, ChevronDown, ThumbsUp, ChevronsRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Page {
    id: string;
    imageUrl: string;
    width?: number;
    height?: number;
}

interface ReaderContainerProps {
    comicId: string;
    chapterId: string;
    chapterTitle: string;
    pages: Page[];
    prevChapterId?: string;
    prevChapterTitle?: string;
    nextChapterId?: string;
    nextChapterTitle?: string;
    chapterNumber?: number;
    allChapters?: { id: string; number: number; title: string }[];
    currentLikes?: number;
    comicTitle?: string;
    coverImageUrl?: string | null;
}

export default function ReaderContainer({
    comicId,
    chapterId,
    chapterTitle,
    pages,
    prevChapterId,
    prevChapterTitle,
    nextChapterId,
    nextChapterTitle,
    chapterNumber,
    allChapters,
    currentLikes,
    comicTitle,
    coverImageUrl,
}: ReaderContainerProps) {
    const { readingMode, showOverlay, toggleOverlay, zoom, setZoom, theme } = useReaderStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [likes, setLikes] = useState(currentLikes || 0);
    const [hasLiked, setHasLiked] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const [imgSrc, setImgSrc] = useState(coverImageUrl || '/placeholder-cover.svg');

    useEffect(() => {
        setImgSrc(coverImageUrl || '/placeholder-cover.svg');
    }, [coverImageUrl]);

    // Handle keyboard shortcut for overlay
    // Handle global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'm' || e.key === 'M') {
                toggleOverlay();
            } else if (e.key === 's' || e.key === 'S') {
                setIsSettingsOpen(prev => !prev);
            } else if (e.key === 'f' || e.key === 'F') {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleOverlay]);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasLiked) {
            setLikes(l => l - 1);
            setHasLiked(false);
        } else {
            setLikes(l => l + 1);
            setHasLiked(true);
        }
    };

    const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const chapterId = e.target.value;
        if (chapterId) {
            window.location.href = `/reader/${chapterId}`;
        }
    };

    const [isCommentsBlurred, setIsCommentsBlurred] = useState(true);

    // Reset blur when chapter changes
    useEffect(() => {
        setIsCommentsBlurred(true);
    }, [chapterId]);

    const saveProgress = async (percentage: number, pageNum: number = 1) => {
        try {
            await fetch('/api/reader/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapterId,
                    pageNumber: pageNum,
                    scrollPercentage: percentage
                }),
            });
        } catch (error) {
            console.error('Failed to save progress', error);
        }
    };

    // Debounce save progress
    const [lastSavedTime, setLastSavedTime] = useState(0);

    const handlePageChange = (pageIndex: number) => {
        // Save progress immediately on page change (or debounce if rapid)
        // For page mode, scrollPercentage is roughly pageIndex / totalPages
        const percentage = pages.length > 0 ? (pageIndex + 1) / pages.length : 0;
        saveProgress(percentage, pageIndex + 1);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        // Unblur if scrolled past 90%
        if (scrollPercentage > 0.9 && isCommentsBlurred) {
            setIsCommentsBlurred(false);
        }

        // Save progress every 5 seconds max
        const now = Date.now();
        if (now - lastSavedTime > 5000) {
            saveProgress(scrollPercentage);
            setLastSavedTime(now);
        }
    };

    // Save on unmount
    useEffect(() => {
        return () => {
            // We can't easily get the *current* scroll here without a ref, 
            // but the periodic save should be good enough for now.
        };
    }, [chapterId]);

    const getThemeBg = () => {
        switch (theme) {
            case 'LIGHT': return 'bg-gray-100';
            case 'DARK': return 'bg-gray-900';
            case 'BLACK': return 'bg-black';
            default: return 'bg-gray-950';
        }
    };

    return (
        <div className={`flex min-h-screen overflow-hidden ${getThemeBg()}`}>
            {/* Main Content Area */}
            <div className={`flex-1 relative transition-all duration-300 ${isSidebarOpen ? 'mr-0 lg:mr-[400px]' : ''}`}>

                {/* Top Header (Back & Title) */}
                <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isSidebarOpen ? 'lg:right-[400px]' : ''} ${showOverlay ? 'translate-y-0' : '-translate-y-full'}`}>
                    <div className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 p-4 flex items-center justify-between text-white shadow-lg">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/comic/${comicId}`}
                                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="font-bold text-sm md:text-base line-clamp-1">{chapterTitle}</h1>
                            </div>
                        </div>

                        {/* Mobile Toggle for Sidebar */}
                        <button
                            className="lg:hidden p-2 hover:bg-gray-800 rounded-full"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {/* Reader Content */}
                <div
                    className="h-screen overflow-y-auto"
                    onScroll={handleScroll}
                    onClick={() => {
                        if (readingMode === 'STRIP') toggleOverlay();
                        setIsSettingsOpen(false);
                    }}
                >
                    {readingMode === 'STRIP' ? (
                        <StripReader
                            pages={pages}
                            prevChapterId={prevChapterId}
                            prevChapterTitle={prevChapterTitle}
                            nextChapterId={nextChapterId}
                            nextChapterTitle={nextChapterTitle}
                        />
                    ) : (
                        <PageReader
                            pages={pages}
                            onNextChapter={() => nextChapterId && (window.location.href = `/reader/${nextChapterId}`)}
                            onPrevChapter={() => prevChapterId && (window.location.href = `/reader/${prevChapterId}`)}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>

                {/* Floating Zoom Controls */}
                <div className={`fixed bottom-8 left-8 z-50 transition-all duration-300 origin-bottom-left scale-[0.8] ${showOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-full px-4 py-2 flex items-center gap-4 shadow-xl">
                        <button
                            onClick={(e) => { e.stopPropagation(); setZoom(Math.max(10, zoom - 10)); }}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            <Minus size={20} />
                        </button>
                        <span className="text-white font-mono min-w-[3ch] text-center">{zoom}%</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setZoom(Math.min(300, zoom + 10)); }}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className={`fixed top-0 right-0 bottom-0 w-full lg:w-[400px] bg-[#1a1d21] border-l border-gray-800 z-[60] transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Sidebar Header / Navigation */}
                <div className="p-4 border-b border-gray-700/50 bg-[#1a1d21]">
                    {/* Comic Header */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
                        <div className="w-12 h-16 flex-shrink-0 bg-gray-800 rounded overflow-hidden relative">
                            <Image
                                src={imgSrc}
                                alt={comicTitle || 'Comic Cover'}
                                fill
                                className="object-cover"
                                onError={() => setImgSrc('/placeholder-cover.svg')}
                                sizes="48px"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <Link href={`/comic/${comicId}`} className="text-blue-400 hover:text-blue-300 font-bold text-sm line-clamp-2 leading-tight">
                                {comicTitle}
                            </Link>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                            title="Collapse Sidebar"
                        >
                            <ChevronsRight size={20} />
                        </button>
                    </div>

                    {/* Top Row: Nav & Lang */}
                    <div className="flex gap-2 mb-2">
                        {/* Navigation Group */}
                        <div className="flex bg-[#222529] rounded-md overflow-hidden flex-1 border border-gray-700">
                            <Link
                                href={prevChapterId ? `/reader/${prevChapterId}` : '#'}
                                className={`px-3 py-2 hover:bg-gray-700 transition-colors border-r border-gray-700 flex items-center ${!prevChapterId && 'opacity-50 pointer-events-none'}`}
                            >
                                <ChevronLeft size={18} className="text-gray-400" />
                            </Link>

                            <div className="flex-1 relative">
                                <select
                                    value={chapterId}
                                    onChange={handleChapterChange}
                                    className="w-full h-full appearance-none bg-transparent text-gray-200 text-sm font-medium pl-3 pr-8 cursor-pointer focus:outline-none"
                                >
                                    {allChapters?.map(c => (
                                        <option key={c.id} value={c.id} className="bg-gray-800">
                                            {c.title ? `Ch. ${c.number} - ${c.title}` : `Chapter ${c.number}`}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>

                            <Link
                                href={nextChapterId ? `/reader/${nextChapterId}` : '#'}
                                className={`px-3 py-2 hover:bg-gray-700 transition-colors border-l border-gray-700 flex items-center ${!nextChapterId && 'opacity-50 pointer-events-none'}`}
                            >
                                <ChevronRight size={18} className="text-gray-400" />
                            </Link>
                        </div>

                        {/* Language Selector */}
                        <div className="relative w-28 bg-[#222529] rounded-md border border-gray-700">
                            <select className="w-full h-full appearance-none bg-transparent text-gray-200 text-sm px-3 cursor-pointer focus:outline-none">
                                <option>English</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex justify-between items-center mb-4 px-1">
                        <div className="relative group">
                            <button className="flex items-center gap-2 text-cyan-400 font-medium text-sm hover:text-cyan-300 transition-colors">
                                <span>Drake Scans</span>
                                <ChevronDown size={14} />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full left-0 mt-2 w-48 bg-[#222529] border border-gray-700 rounded-md shadow-xl overflow-hidden z-50 hidden group-hover:block">
                                <div className="p-1">
                                    <button className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-cyan-400 font-medium rounded-sm">
                                        Drake Scans
                                    </button>
                                    <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-sm transition-colors">
                                        Mewing Scanlation
                                    </button>
                                    <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-sm transition-colors">
                                        Manhuaga
                                    </button>
                                </div>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500">{new Date().toLocaleDateString()}</span>
                    </div>

                    {/* Upvote Button */}
                    <button
                        onClick={handleLike}
                        className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
                    >
                        <ThumbsUp size={28} className={`transition-transform group-hover:scale-110 ${hasLiked ? 'fill-blue-500 text-blue-500' : ''}`} />
                        <span className={`text-xl font-medium ${hasLiked ? 'text-blue-500' : ''}`}>{likes}</span>
                    </button>
                </div>

                {/* Comments Section */}
                <CommentSection
                    chapterId={chapterId}
                    isBlurred={isCommentsBlurred}
                    onUnblur={() => setIsCommentsBlurred(false)}
                />

                {/* Settings Toggle (Bottom of sidebar) */}
                <div className="p-4 border-t border-gray-800 bg-[#1a1d21]">
                    <div className="relative">
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="w-full flex items-center justify-center gap-2 p-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                        >
                            <Settings size={18} />
                            <span className="text-sm">Reader Settings</span>
                        </button>
                        {isSettingsOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 z-[100]">
                                <ReaderSettings />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
