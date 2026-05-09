'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';


import { Suspense } from 'react';

function SubmitContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preSelectedComicId = searchParams.get('comicId');

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [flair, setFlair] = useState('Discussion');
    const [comicId, setComicId] = useState(preSelectedComicId || '');
    const [comics, setComics] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch comics for selector
        // We can reuse the search API or a simple list API
        // For now, let's assume we have a way to get comics. 
        // I'll fetch from /api/comics?limit=100 (if supported) or just search
        fetch('/api/comics')
            .then(res => res.json())
            .then(data => setComics(data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/community/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    comicId,
                    flair,
                }),
            });

            if (res.ok) {
                const post = await res.json();
                router.push(`/community/post/${post.id}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">Create a Post</h1>

                <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-xl border border-gray-800 space-y-6">
                    {/* Comic Selector */}
                    <div>
                        <label className="block text-sm font-bold mb-2">Choose a Community</label>
                        <select
                            value={comicId}
                            onChange={(e) => setComicId(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                            required
                        >
                            <option value="">Select a comic...</option>
                            {comics.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                            placeholder="An interesting title"
                            required
                            maxLength={300}
                        />
                    </div>

                    {/* Flair */}
                    <div>
                        <label className="block text-sm font-bold mb-2">Flair</label>
                        <select
                            value={flair}
                            onChange={(e) => setFlair(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="Discussion">Discussion</option>
                            <option value="Theory">Theory</option>
                            <option value="Art">Fan Art</option>
                            <option value="Question">Question</option>
                        </select>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-bold mb-2">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 min-h-[200px]"
                            placeholder="Share your thoughts..."
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SubmitPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
            <SubmitContent />
        </Suspense>
    );
}
