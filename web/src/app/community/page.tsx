'use client';

import { useState } from 'react';
import CommunityFeed from '@/components/community/CommunityFeed';
import Sidebar from '@/components/community/Sidebar';
import CreatePostModal from '@/components/community/CreatePostModal';
import PostModal from '@/components/community/PostModal';
import { Plus } from 'lucide-react';

export default function CommunityPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewPostId, setViewPostId] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Page Header */}
            <div className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 pt-24 pb-8">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-2">Community</h1>
                    <p className="text-gray-400">The front page of OmniRead. Discover, discuss, and dive deeper.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Mobile Create Post (Visible only on small screens) */}
                        <div className="lg:hidden">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                <Plus size={20} />
                                Create Post
                            </button>
                        </div>

                        <CommunityFeed onPostClick={setViewPostId} />
                    </div>

                    {/* Sidebar Column (Hidden on mobile) */}
                    <div className="hidden lg:block space-y-6">
                        {/* Create Post Button */}
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                        >
                            <Plus size={20} />
                            Create Post
                        </button>

                        <Sidebar />
                    </div>
                </div>
            </div>

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <PostModal
                isOpen={!!viewPostId}
                onClose={() => setViewPostId(null)}
                postId={viewPostId || ''}
            />
        </div>
    );
}
