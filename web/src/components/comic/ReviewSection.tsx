'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Review {
    id: string;
    recommend: boolean;
    comment: string | null;
    createdAt: string;
    user: { username: string };
    reactionCounts?: Record<string, number>;
}

interface ReviewStats {
    total: number;
    positive: number;
    negative: number;
    percent: number;
}

export default function ReviewSection({ comicId, comicTitle, coverImageUrl, comicType }: { comicId: string, comicTitle: string, coverImageUrl: string, comicType?: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [recommend, setRecommend] = useState<boolean | null>(null);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, [comicId]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/reviews?comicId=${comicId}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (recommend === null) return;

        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comicId,
                    comicTitle,
                    coverImageUrl,
                    comicType,
                    userId: 'demo_user_id', // Mock ID
                    recommend,
                    comment
                }),
            });

            if (res.ok) {
                fetchReviews();
                setComment('');
                setRecommend(null);
            } else {
                setError('Failed to submit review. Please try again.');
            }
        } catch (error) {
            console.error(error);
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReaction = async (reviewId: string, type: string) => {
        try {
            await fetch('/api/reviews/react', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewId,
                    userId: 'demo_user_id',
                    type
                }),
            });
            fetchReviews(); // Refresh to show new reaction counts
        } catch (error) {
            console.error('Failed to react:', error);
        }
    };

    const getRatingLabel = (percent: number, total: number) => {
        if (total === 0) return 'No Reviews';
        if (percent >= 95) return 'Overwhelmingly Positive';
        if (percent >= 80) return 'Very Positive';
        if (percent >= 70) return 'Mostly Positive';
        if (percent >= 40) return 'Mixed';
        if (percent >= 20) return 'Mostly Negative';
        return 'Overwhelmingly Negative';
    };

    const getRatingColor = (percent: number, total: number) => {
        if (total === 0) return 'text-gray-400';
        if (percent >= 70) return 'text-blue-400';
        if (percent >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

    return (
        <div className="space-y-8">
            {/* Summary Header */}
            {stats && (
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div>
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider font-bold mb-1">Overall Reviews</h3>
                        <div className="flex items-baseline gap-3">
                            <span className={`text-2xl font-bold ${getRatingColor(stats.percent, stats.total)}`}>
                                {getRatingLabel(stats.percent, stats.total)}
                            </span>
                            <span className="text-gray-500 text-sm">({stats.total} reviews)</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{stats.percent}%</div>
                            <div className="text-xs text-gray-500">Positive</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Write Review */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">Write a Review</h3>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setRecommend(true)}
                            className={`flex-1 p-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${recommend === true
                                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                                }`}
                        >
                            <ThumbsUp size={24} />
                            <span className="font-bold">Yes, I recommend it</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRecommend(false)}
                            className={`flex-1 p-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${recommend === false
                                ? 'bg-red-500/20 border-red-500 text-red-400'
                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                                }`}
                        >
                            <ThumbsDown size={24} />
                            <span className="font-bold">No, I don't recommend it</span>
                        </button>
                    </div>

                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write your thoughts here (optional)..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
                    />

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || recommend === null}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Posting...' : 'Post Review'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Most Recent Reviews</h3>
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
                        <MessageSquare size={32} className="mx-auto mb-2 text-gray-600" />
                        <p className="text-gray-400">No reviews yet. Be the first to review!</p>
                    </div>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300">
                                        {review.user.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{review.user.username}</div>
                                        <div className="text-xs text-gray-500">{formatDistanceToNow(new Date(review.createdAt))} ago</div>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${review.recommend ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {review.recommend ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
                                    {review.recommend ? 'Recommended' : 'Not Recommended'}
                                </div>
                            </div>
                            {review.comment && (
                                <p className="text-gray-300 leading-relaxed mb-4">{review.comment}</p>
                            )}

                            {/* Reaction Bar */}
                            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-800">
                                <span className="text-xs text-gray-500 uppercase font-bold mr-2">React:</span>
                                <button
                                    onClick={() => handleReaction(review.id, 'Helpful')}
                                    className="px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors flex items-center gap-1"
                                >
                                    Helpful {(review.reactionCounts?.['Helpful'] || 0) > 0 && <span className="text-blue-400">{(review.reactionCounts?.['Helpful'] || 0)}</span>}
                                </button>
                                <button
                                    onClick={() => handleReaction(review.id, 'Funny')}
                                    className="px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors flex items-center gap-1"
                                >
                                    Funny {(review.reactionCounts?.['Funny'] || 0) > 0 && <span className="text-yellow-400">{(review.reactionCounts?.['Funny'] || 0)}</span>}
                                </button>
                                <div className="w-px h-4 bg-gray-700 mx-2"></div>
                                {REACTION_EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(review.id, emoji)}
                                        className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm transition-colors relative group"
                                    >
                                        {emoji}
                                        {(review.reactionCounts?.[emoji] || 0) > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-gray-700 text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-gray-800">
                                                {(review.reactionCounts?.[emoji] || 0)}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
