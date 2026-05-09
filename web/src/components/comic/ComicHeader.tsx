'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Share2, Star } from 'lucide-react';
import StatusDropdown, { LibraryStatus } from '../library/StatusDropdown';
import AddToFolderDropdown from '../library/AddToFolderDropdown';
import { useRouter } from 'next/navigation';

import { ORIGIN_COLORS } from '@/lib/constants';

interface ComicHeaderProps {
    comic: any;
    folders: any[];
    firstChapterId?: string;
    lastReadChapterId?: string;
    lastReadChapterNumber?: number;
}

export default function ComicHeader({ comic, folders, firstChapterId, lastReadChapterId, lastReadChapterNumber }: ComicHeaderProps) {
    const router = useRouter();
    const originStyle = ORIGIN_COLORS[comic.origin] || { bg: 'bg-gray-600/20', text: 'text-gray-400', border: 'border-gray-600/30', label: comic.origin };

    const continueLink = lastReadChapterId
        ? `/reader/${lastReadChapterId}`
        : firstChapterId
            ? `/reader/${firstChapterId}`
            : '#';

    const continueLabel = lastReadChapterNumber
        ? `Continue ${lastReadChapterNumber}`
        : 'Read First Chapter';

    // Rating Logic
    const [userRating, setUserRating] = useState(comic.myRating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isRating, setIsRating] = useState(false);

    const handleRate = async (rating: number) => {
        setUserRating(rating);
        setIsRating(true);
        try {
            await fetch(`/api/comic/${comic.id}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating }),
            });
            router.refresh();
        } catch (error) {
            console.error('Failed to rate', error);
        } finally {
            setIsRating(false);
        }
    };

    const publishedDate = comic.publishedAt
        ? new Date(comic.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : comic.publishedYear?.toString() || 'Unknown';

    return (
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{comic.title}</h1>

            {/* Alt Titles */}
            {comic.altTitles && Object.values(comic.altTitles).length > 0 && (
                <div className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {Object.values(comic.altTitles).join(' • ')}
                </div>
            )}

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Origin Badge */}
                <span className={`${originStyle.bg} ${originStyle.text} px-3 py-1 rounded text-xs font-bold uppercase border ${originStyle.border}`}>
                    {originStyle.label}
                </span>

                {/* Type Badge */}
                <span className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded text-xs font-bold uppercase border border-purple-600/30">
                    {comic.type}
                </span>

                {/* Status Badge */}
                <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${comic.status === 'COMPLETED'
                    ? 'bg-green-600/20 text-green-400 border-green-600/30'
                    : 'bg-orange-600/20 text-orange-400 border-orange-600/30'
                    }`}>
                    {comic.status}
                </span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-sm text-gray-300 mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Published:</span>
                    <span className="text-blue-400">{publishedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Status:</span>
                    <span className={`flex items-center gap-1.5 ${comic.status === 'ONGOING' ? 'text-blue-400' :
                        comic.status === 'COMPLETED' ? 'text-green-400' :
                            'text-gray-400'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${comic.status === 'ONGOING' ? 'bg-blue-500' :
                            comic.status === 'COMPLETED' ? 'bg-green-500' :
                                'bg-gray-500'
                            }`} />
                        {comic.status ? (comic.status.charAt(0) + comic.status.slice(1).toLowerCase()) : 'Unknown'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Ranked:</span>
                    <span className="text-white">#{comic.rank || 'N/A'}</span>
                    <span className="text-gray-500 ml-2">Followed by {comic.followersCount?.toLocaleString() || 0} users</span>
                </div>
            </div>


            {/* Rating */}
            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
                <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map(i => {
                        const starValue = i * 2; // 2, 4, 6, 8, 10
                        const currentRating = hoverRating || userRating;
                        const isFilled = currentRating >= starValue;
                        const isHalf = currentRating >= starValue - 1 && !isFilled;

                        return (
                            <button
                                key={i}
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const isLeft = e.clientX - rect.left < rect.width / 2;
                                    setHoverRating(isLeft ? starValue - 1 : starValue);
                                }}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => handleRate(hoverRating)}
                                className="focus:outline-none transition-transform hover:scale-110 relative"
                            >
                                {/* Background Star (Empty) */}
                                <Star size={20} className="text-gray-600" />

                                {/* Foreground Star (Filled or Half) */}
                                <div className="absolute inset-0 overflow-hidden" style={{ width: isFilled ? '100%' : isHalf ? '50%' : '0%' }}>
                                    <Star size={20} className="fill-current text-yellow-400" />
                                </div>
                            </button>
                        );
                    })}
                </div>
                <span className="font-bold text-white text-lg">{comic.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-500 text-sm">({comic.ratingCount || 0} ratings)</span>
                {userRating > 0 && <span className="text-blue-400 text-xs ml-2">You rated: {userRating}</span>}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
                <Link href={continueLink} className="flex-1 sm:flex-none">
                    <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-md transition-colors flex items-center justify-center gap-2">
                        <Play size={18} className="fill-current" />
                        {continueLabel}
                    </button>
                </Link>

                <div className="w-40">
                    <StatusDropdown comicId={comic.id} currentStatus={comic.myStatus} />
                </div>

                <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer transition-colors">
                    <AddToFolderDropdown comicId={comic.id} folders={folders} initialFolderIds={comic.folderIds} />
                </div>

                <button className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                    <Share2 size={18} />
                </button>
            </div>
        </div>
    );
}
