'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2 } from 'lucide-react';
import RichTextParser from '../shared/RichTextParser';
import Image from 'next/image';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { username: string };
    score: number;
    userVote?: number;
    replies?: Comment[];
}

interface Post {
    id: string;
    title: string;
    content: string;
    score: number;
    createdAt: string;
    user: { username: string };
    comic: { title: string; slug: string; coverImageUrl?: string };
    _count: { comments: number };
    userVote?: number;
}

function CommentItem({ comment, postId, onReplySuccess }: { comment: Comment, postId: string, onReplySuccess: () => void }) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState(comment.score || 0);
    const [userVote, setUserVote] = useState(comment.userVote || 0);

    useEffect(() => {
        setScore(comment.score || 0);
        setUserVote(comment.userVote || 0);
    }, [comment]);

    const handleVote = async (value: number) => {
        const previousScore = score;
        const previousUserVote = userVote;

        let newScore = score;
        let newUserVote = value;

        if (userVote === value) {
            // Toggle off
            newScore = score - value;
            newUserVote = 0;
        } else if (userVote === 0) {
            // New vote
            newScore = score + value;
        } else {
            // Switch vote (e.g. -1 to 1)
            newScore = score - userVote + value;
        }

        // Optimistic update
        setScore(newScore);
        setUserVote(newUserVote);

        try {
            await fetch('/api/comments/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error(error);
            // Revert
            setScore(previousScore);
            setUserVote(previousUserVote);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: replyContent,
                    postId,
                    parentId: comment.id
                }),
            });
            if (res.ok) {
                setReplyContent('');
                setIsReplying(false);
                onReplySuccess();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(`${window.location.origin}/community/post/${postId}?commentId=${comment.id}`);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="flex gap-3 mt-4">
            {/* Avatar Column */}
            <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    {comment.user.username.substring(0, 2).toUpperCase()}
                </div>
            </div>

            {/* Content Column */}
            <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <span className="font-bold text-gray-300">{comment.user.username}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                </div>

                <div className="text-gray-300 mb-2 text-sm">
                    <RichTextParser content={comment.content} />
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-2">
                    {/* Vote Pill */}
                    <div className="flex items-center bg-gray-800 rounded-full px-2 py-1 gap-1 border border-gray-700">
                        <button
                            onClick={() => handleVote(1)}
                            className={`transition-colors p-0.5 ${userVote === 1 ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`}
                        >
                            <ArrowBigUp size={16} fill={userVote === 1 ? "currentColor" : "none"} />
                        </button>
                        <span className={`text-xs font-bold min-w-[1ch] text-center ${userVote !== 0 ? (userVote === 1 ? 'text-orange-500' : 'text-blue-500') : 'text-gray-300'}`}>
                            {score}
                        </span>
                        <button
                            onClick={() => handleVote(-1)}
                            className={`transition-colors p-0.5 ${userVote === -1 ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                        >
                            <ArrowBigDown size={16} fill={userVote === -1 ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsReplying(!isReplying)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-gray-800 text-xs font-medium text-gray-400 transition-colors"
                    >
                        <MessageSquare size={14} />
                        Reply
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-gray-800 text-xs font-medium text-gray-400 transition-colors"
                    >
                        <Share2 size={14} />
                        Share
                    </button>
                </div>

                {isReplying && (
                    <form onSubmit={handleReply} className="mb-4 mt-2">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                            rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsReplying(false)}
                                className="text-xs text-gray-400 hover:text-white px-3 py-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !replyContent.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-4 rounded-full disabled:opacity-50"
                            >
                                Reply
                            </button>
                        </div>
                    </form>
                )}

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 pl-4 border-l-2 border-gray-800">
                        {comment.replies.map((reply) => (
                            <CommentItem key={reply.id} comment={reply} postId={postId} onReplySuccess={onReplySuccess} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PostThread({ postId }: { postId: string }) {
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [userVote, setUserVote] = useState(0);

    useEffect(() => {
        if (post) {
            setUserVote(post.userVote || 0);
        }
    }, [post]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Comments
                const commentsRes = await fetch(`/api/comments?postId=${postId}`);
                if (commentsRes.ok) {
                    setComments(await commentsRes.json());
                }

                // Fetch Post details
                const postRes = await fetch(`/api/community/posts?id=${postId}`);
                if (postRes.ok) {
                    setPost(await postRes.json());
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [postId]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment,
                    postId,
                }),
            });

            if (res.ok) {
                const comment = await res.json();
                setComments([comment, ...comments]); // Add to top (optimistic-ish)
                setNewComment('');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchComments = async () => {
        const commentsRes = await fetch(`/api/comments?postId=${postId}`);
        if (commentsRes.ok) {
            setComments(await commentsRes.json());
        }
    };

    const handleVote = async (value: number) => {
        if (!post) return;

        const previousScore = post.score;
        const previousUserVote = userVote;

        let newScore = post.score;
        let newUserVote = value;

        if (userVote === value) {
            // Toggle off
            newScore = post.score - value;
            newUserVote = 0;
        } else if (userVote === 0) {
            // New vote
            newScore = post.score + value;
        } else {
            // Switch vote
            newScore = post.score - userVote + value;
        }

        // Optimistic update
        setPost({ ...post, score: newScore, userVote: newUserVote });
        setUserVote(newUserVote);

        try {
            await fetch('/api/community/posts/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error(error);
            // Revert
            setPost({ ...post, score: previousScore, userVote: previousUserVote });
            setUserVote(previousUserVote);
        }
    };

    const handleSharePost = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Post link copied to clipboard!');
    };

    if (loading) return <div className="p-8 text-center">Loading discussion...</div>;

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {/* Comic Header Context */}
            {post?.comic && (
                <div className="h-32 relative w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10" />
                    <Image
                        src={post.comic.coverImageUrl || '/placeholder-cover.svg'}
                        alt={post.comic.title}
                        fill
                        className="object-cover opacity-50 blur-sm"
                        onError={(e) => e.currentTarget.src = '/placeholder-cover.svg'}
                        sizes="100vw"
                    />
                    <div className="absolute bottom-4 left-6 z-20 flex items-center gap-4">
                        <div className="w-12 h-16 relative rounded shadow-lg border border-gray-700 overflow-hidden">
                            <Image
                                src={post.comic.coverImageUrl || '/placeholder-cover.svg'}
                                alt={post.comic.title}
                                fill
                                className="object-cover"
                                onError={(e) => e.currentTarget.src = '/placeholder-cover.svg'}
                                sizes="48px"
                            />
                        </div>
                        <h2 className="text-xl font-bold text-white shadow-black drop-shadow-md">
                            c/{post.comic.title}
                        </h2>
                    </div>
                </div>
            )}

            {/* Post Content */}
            <div className="p-6 border-b border-gray-800">
                <div className="flex gap-4">
                    {/* Vote Column */}
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => handleVote(1)}
                            className={`transition-colors p-1 ${userVote === 1 ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`}
                        >
                            <ArrowBigUp size={28} fill={userVote === 1 ? "currentColor" : "none"} />
                        </button>
                        <span className={`font-bold text-lg ${userVote !== 0 ? (userVote === 1 ? 'text-orange-500' : 'text-blue-500') : 'text-white'}`}>
                            {post?.score || 0}
                        </span>
                        <button
                            onClick={() => handleVote(-1)}
                            className={`transition-colors p-1 ${userVote === -1 ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                        >
                            <ArrowBigDown size={28} fill={userVote === -1 ? "currentColor" : "none"} />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold mb-4">{post?.title || 'Post Title'}</h1>
                        <div className="text-gray-300 mb-6">
                            {post?.content ? (
                                <RichTextParser content={post.content} />
                            ) : post ? null : (
                                'Loading post content...'
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full">
                                <MessageSquare size={16} />
                                {comments.length} Comments
                            </div>
                            <button onClick={handleSharePost} className="flex items-center gap-2 hover:bg-gray-800 px-3 py-1.5 rounded-full transition-colors">
                                <Share2 size={16} />
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comment Input */}
            <div className="p-6 bg-gray-900/50">
                <form onSubmit={handleCommentSubmit} className="mb-8">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="What are your thoughts?"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Comment
                        </button>
                    </div>
                </form>

                {/* Comments List */}
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            onReplySuccess={fetchComments}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
