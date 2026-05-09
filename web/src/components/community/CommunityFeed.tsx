'use client';

import { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { Flame, Clock, Trophy, Home, TrendingUp } from 'lucide-react';

interface CommunityFeedProps {
    comicId?: string;
    onPostClick?: (postId: string) => void;
}

export default function CommunityFeed({ comicId, onPostClick }: CommunityFeedProps) {
    const [posts, setPosts] = useState<any[]>([]);
    const [sort, setSort] = useState(comicId ? 'popular' : 'home');
    const [topTime, setTopTime] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, [comicId, sort, topTime]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ sort });
            if (comicId) params.set('comicId', comicId);
            if (sort === 'top') params.set('time', topTime);

            const res = await fetch(`/api/community/posts?${params}`);
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Sort Controls */}
            <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg w-fit border border-gray-800 overflow-x-auto">
                {!comicId && (
                    <>
                        <button
                            onClick={() => setSort('home')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${sort === 'home' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <Home size={16} /> Home
                        </button>
                        <div className="w-px h-6 bg-gray-800 mx-1" />
                    </>
                )}
                <button
                    onClick={() => setSort('popular')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${sort === 'popular' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                >
                    <Flame size={16} /> Popular
                </button>
                <button
                    onClick={() => setSort('rising')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${sort === 'rising' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                >
                    <TrendingUp size={16} /> Rising
                </button>
                <button
                    onClick={() => setSort('top')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${sort === 'top' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                >
                    <Trophy size={16} /> Top
                </button>

                {/* Time Selector for Top Sort */}
                {sort === 'top' && (
                    <select
                        value={topTime}
                        onChange={(e) => setTopTime(e.target.value)}
                        className="bg-gray-800 text-white text-xs rounded-md px-2 py-1.5 border border-gray-700 focus:outline-none"
                    >
                        <option value="day">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="all">All Time</option>
                    </select>
                )}

                <button
                    onClick={() => setSort('new')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${sort === 'new' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                >
                    <Clock size={16} /> New
                </button>
            </div>

            {/* Post List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-gray-900 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-gray-900 rounded-xl border border-dashed border-gray-800">
                    <p className="text-gray-400">No posts yet. Be the first to start a discussion!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onClick={onPostClick ? () => onPostClick(post.id) : undefined}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
