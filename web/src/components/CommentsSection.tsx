'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        username: string;
    };
}

export default function CommentsSection({ chapterId }: { chapterId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, [chapterId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/comments?chapterId=${chapterId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Failed to fetch comments', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapterId,
                    content: newComment,
                }),
            });

            if (res.ok) {
                const comment = await res.json();
                setComments([comment, ...comments]);
                setNewComment('');
            }
        } catch (error) {
            console.error('Failed to post comment', error);
        }
    };

    return (
        <div className="bg-gray-900 text-white p-6 max-w-3xl mx-auto mt-8 rounded-lg">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare size={20} />
                Comments ({comments.length})
            </h3>

            <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Join the discussion..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
                <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
                >
                    <Send size={20} />
                </button>
            </form>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center text-gray-500">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No comments yet. Be the first!</div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-800/50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-blue-400">{comment.user.username}</span>
                                <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-300">{comment.content}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
