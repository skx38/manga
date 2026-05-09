'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, ShieldAlert } from 'lucide-react';

export default function Sidebar() {
    const [trending, setTrending] = useState<{ id: string; title: string; slug: string; postCount: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await fetch('/api/community/trending');
                if (res.ok) {
                    setTrending(await res.json());
                }
            } catch (error) {
                console.error('Failed to fetch trending communities', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrending();
    }, []);

    return (
        <div className="space-y-6">
            {/* Trending Communities Widget */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-gray-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-orange-500" size={20} />
                        Trending Communities
                    </h3>
                </div>
                <div className="divide-y divide-gray-800">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Loading trends...</div>
                    ) : trending.length > 0 ? (
                        trending.map((comic, index) => (
                            <Link
                                key={comic.id}
                                href={`/comic/${comic.slug}`}
                                className="block p-3 hover:bg-gray-800 transition-colors group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-gray-500 font-mono w-4 flex-shrink-0">{index + 1}.</span>
                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                                            {comic.title}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                        {comic.postCount} posts
                                    </span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">No trending communities yet</div>
                    )}
                </div>
                <div className="p-3 bg-gray-800/30 text-center">
                    <Link href="/search" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                        View All Communities
                    </Link>
                </div>
            </div>

            {/* Rules Widget */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 bg-gray-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="text-red-500" size={20} />
                        Community Rules
                    </h3>
                </div>
                <div className="p-4 text-sm text-gray-400 space-y-3">
                    <div className="flex gap-3">
                        <span className="font-bold text-gray-600">1.</span>
                        <p>Be respectful to other readers. No hate speech or harassment.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-bold text-gray-600">2.</span>
                        <p>No untagged spoilers. Use the spoiler tag for recent chapters.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-bold text-gray-600">3.</span>
                        <p>Keep posts relevant to manga, anime, or webtoons.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-bold text-gray-600">4.</span>
                        <p>No piracy links or illegal distribution discussion.</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-gray-600 px-2">
                <p>&copy; 2025 OmniRead. All rights reserved.</p>
            </div>
        </div>
    );
}
