'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import CommunityFeed from '@/components/community/CommunityFeed';
import ReviewSection from '@/components/comic/ReviewSection';
import CreatePostModal from '@/components/community/CreatePostModal';
import PostModal from '@/components/community/PostModal';

interface ComicTabsProps {
    comicId: string;
    comicTitle: string;
    coverImageUrl: string;
    comicType?: string;
    chapters: any[];
    reviews: any[];
}

export default function ComicTabs({ comicId, comicTitle, coverImageUrl, comicType, chapters, reviews }: ComicTabsProps) {
    const [activeTab, setActiveTab] = useState<'chapters' | 'community' | 'reviews'>('chapters');
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    return (
        <div className="mt-12">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-800 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('chapters')}
                    className={`px-6 py-3 font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'chapters' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                >
                    Chapters ({chapters.length})
                </button>
                <button
                    onClick={() => setActiveTab('community')}
                    className={`px-6 py-3 font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'community' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                >
                    Community
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`px-6 py-3 font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'reviews' ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                >
                    Reviews ({reviews.length})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'chapters' && (
                <div className="grid gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {chapters.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No chapters released yet.</div>
                    ) : (
                        chapters.map((chapter) => (
                            <Link
                                key={chapter.id}
                                href={`/reader/${chapter.id}`}
                                className="flex items-center justify-between p-4 rounded-lg transition-colors bg-gray-900/50 text-gray-300 hover:bg-gray-800 border border-gray-800 hover:border-gray-700"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-white">{chapter.title}</span>
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
                        ))
                    )}
                </div>
            )}

            {activeTab === 'community' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">r/{comicTitle}</h3>
                        <button
                            onClick={() => setIsCreatePostOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                        >
                            Create Post
                        </button>
                    </div>
                    <CommunityFeed
                        comicId={comicId}
                        onPostClick={(postId) => setSelectedPostId(postId)}
                    />
                    <CreatePostModal
                        isOpen={isCreatePostOpen}
                        onClose={() => setIsCreatePostOpen(false)}
                        preselectedComic={{
                            id: comicId,
                            title: comicTitle,
                            slug: comicId, // Using ID as slug fallback since we don't have slug in props
                            coverImageUrl: coverImageUrl
                        }}
                        onPostCreated={() => {
                            // Ideally trigger a refresh of the feed here
                            window.location.reload();
                        }}
                    />
                    <PostModal
                        isOpen={!!selectedPostId}
                        onClose={() => setSelectedPostId(null)}
                        postId={selectedPostId || ''}
                    />
                </div>
            )}

            {activeTab === 'reviews' && (
                <ReviewSection
                    comicId={comicId}
                    comicTitle={comicTitle}
                    coverImageUrl={coverImageUrl}
                    comicType={comicType}
                />
            )}
        </div>
    );
}
