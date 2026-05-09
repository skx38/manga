'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, ChevronDown } from 'lucide-react';
import RichTextParser from '../shared/RichTextParser';
import Image from 'next/image';

const MAX_DEPTH = 4;

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

const AVATAR_COLORS = [
    'from-brand to-purple-600',
    'from-pink to-brand',
    'from-success to-cyan-500',
    'from-warning to-orange-500',
    'from-destructive to-pink',
];

function avatarColor(username: string) {
    const idx = username.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
}

function VotePill({ score, userVote, onVote }: { score: number; userVote: number; onVote: (v: number) => void }) {
    const scoreColor = userVote === 1 ? 'text-vote-up' : userVote === -1 ? 'text-vote-down' : 'text-foreground';
    return (
        <div className="flex items-center bg-muted rounded-full px-1 py-0.5 gap-0.5 border border-border">
            <button
                onClick={() => onVote(1)}
                aria-label="Upvote"
                className={[
                    'p-1 rounded-full transition-all active:scale-75',
                    userVote === 1
                        ? 'text-vote-up'
                        : 'text-muted-foreground hover:text-vote-up',
                ].join(' ')}
            >
                <ArrowBigUp size={15} fill={userVote === 1 ? 'currentColor' : 'none'} />
            </button>
            <span className={`text-xs font-bold min-w-[1.5ch] text-center tabular-nums ${scoreColor}`}>{score}</span>
            <button
                onClick={() => onVote(-1)}
                aria-label="Downvote"
                className={[
                    'p-1 rounded-full transition-all active:scale-75',
                    userVote === -1
                        ? 'text-vote-down'
                        : 'text-muted-foreground hover:text-vote-down',
                ].join(' ')}
            >
                <ArrowBigDown size={15} fill={userVote === -1 ? 'currentColor' : 'none'} />
            </button>
        </div>
    );
}

function CommentItem({
    comment,
    postId,
    depth,
    onReplySuccess,
}: {
    comment: Comment;
    postId: string;
    depth: number;
    onReplySuccess: () => void;
}) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState(comment.score || 0);
    const [userVote, setUserVote] = useState(comment.userVote || 0);
    const [showReplies, setShowReplies] = useState(depth < MAX_DEPTH);

    useEffect(() => {
        setScore(comment.score || 0);
        setUserVote(comment.userVote || 0);
    }, [comment]);

    const handleVote = async (value: number) => {
        const prev = { score, userVote };
        let newScore = score;
        let newVote = value;
        if (userVote === value) { newScore = score - value; newVote = 0; }
        else if (userVote === 0) { newScore = score + value; }
        else { newScore = score - userVote + value; }

        setScore(newScore);
        setUserVote(newVote);

        try {
            const res = await fetch('/api/comments/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId: comment.id, value }),
            });
            if (res.ok) {
                const data = await res.json();
                setScore(data.score);
            } else {
                setScore(prev.score);
                setUserVote(prev.userVote);
            }
        } catch {
            setScore(prev.score);
            setUserVote(prev.userVote);
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
                body: JSON.stringify({ content: replyContent, postId, parentId: comment.id }),
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

    const replyCount = comment.replies?.length ?? 0;

    return (
        <div className="flex gap-3 mt-3 group/comment">
            {/* Avatar + thread line */}
            <div className="flex flex-col items-center gap-0 flex-shrink-0">
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColor(comment.user.username)} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                    {comment.user.username.substring(0, 2).toUpperCase()}
                </div>
                {/* Vertical thread guide line */}
                {replyCount > 0 && showReplies && (
                    <div className="w-px flex-1 mt-1 bg-border/50 group-hover/comment:bg-border transition-colors" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="font-semibold text-foreground">{comment.user.username}</span>
                    <span className="text-border">•</span>
                    <span>{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                </div>

                <div className="text-sm text-foreground/90 mb-2 leading-relaxed">
                    <RichTextParser content={comment.content} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <VotePill score={score} userVote={userVote} onVote={handleVote} />

                    <button
                        onClick={() => setIsReplying(!isReplying)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-accent text-xs font-medium text-muted-foreground hover:text-accent-foreground transition-colors"
                    >
                        <MessageSquare size={13} />
                        Reply
                    </button>

                    <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/community/post/${postId}?commentId=${comment.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-accent text-xs font-medium text-muted-foreground hover:text-accent-foreground transition-colors"
                    >
                        <Share2 size={13} />
                        Share
                    </button>
                </div>

                {/* Reply form */}
                {isReplying && (
                    <form onSubmit={handleReply} className="mt-3 mb-2">
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply…"
                            className="w-full bg-muted border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsReplying(false)}
                                className="text-xs text-muted-foreground hover:text-foreground px-3 py-1 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !replyContent.trim()}
                                className="bg-brand hover:bg-brand/90 text-brand-foreground text-xs font-semibold py-1.5 px-4 rounded-full disabled:opacity-50 transition-colors"
                            >
                                {submitting ? 'Posting…' : 'Reply'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Nested replies */}
                {replyCount > 0 && (
                    <div className="mt-1">
                        {depth >= MAX_DEPTH ? (
                            /* Deep thread — collapse and show count */
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="flex items-center gap-1.5 text-xs text-brand hover:underline mt-2"
                            >
                                <ChevronDown size={14} className={`transition-transform ${showReplies ? 'rotate-180' : ''}`} />
                                {showReplies ? 'Collapse' : `${replyCount} more ${replyCount === 1 ? 'reply' : 'replies'}`}
                            </button>
                        ) : null}

                        {showReplies && (
                            <div className="mt-2 space-y-0">
                                {comment.replies!.map((reply) => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        postId={postId}
                                        depth={depth + 1}
                                        onReplySuccess={onReplySuccess}
                                    />
                                ))}
                            </div>
                        )}
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
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (post) setUserVote(post.userVote || 0);
    }, [post]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [commentsRes, postRes] = await Promise.all([
                    fetch(`/api/comments?postId=${postId}`),
                    fetch(`/api/community/posts?id=${postId}`),
                ]);
                if (commentsRes.ok) setComments(await commentsRes.json());
                if (postRes.ok) setPost(await postRes.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [postId]);

    const fetchComments = async () => {
        const res = await fetch(`/api/comments?postId=${postId}`);
        if (res.ok) setComments(await res.json());
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment, postId }),
            });
            if (res.ok) {
                const comment = await res.json();
                setComments([comment, ...comments]);
                setNewComment('');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVote = async (value: number) => {
        if (!post) return;
        const prev = { score: post.score, userVote };
        let newScore = post.score;
        let newVote = value;
        if (userVote === value) { newScore = post.score - value; newVote = 0; }
        else if (userVote === 0) { newScore = post.score + value; }
        else { newScore = post.score - userVote + value; }

        setPost({ ...post, score: newScore, userVote: newVote });
        setUserVote(newVote);

        try {
            const res = await fetch('/api/community/posts/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId, value }),
            });
            if (res.ok) {
                const data = await res.json();
                setPost((p) => p ? { ...p, score: data.score } : p);
            } else {
                setPost((p) => p ? { ...p, score: prev.score, userVote: prev.userVote } : p);
                setUserVote(prev.userVote);
            }
        } catch {
            setPost((p) => p ? { ...p, score: prev.score, userVote: prev.userVote } : p);
            setUserVote(prev.userVote);
        }
    };

    if (loading) {
        return (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 space-y-4 animate-pulse">
                    <div className="h-6 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-4/5" />
                </div>
            </div>
        );
    }

    const postScoreColor = userVote === 1 ? 'text-vote-up' : userVote === -1 ? 'text-vote-down' : 'text-foreground';

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Comic Header Context */}
            {post?.comic && (
                <div className="h-32 relative w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent z-10" />
                    <Image
                        src={post.comic.coverImageUrl || '/placeholder-cover.svg'}
                        alt={post.comic.title}
                        fill
                        className="object-cover opacity-40 blur-sm"
                        onError={(e) => { e.currentTarget.src = '/placeholder-cover.svg'; }}
                        sizes="100vw"
                    />
                    <div className="absolute bottom-4 left-6 z-20 flex items-center gap-3">
                        <div className="w-12 h-16 relative rounded shadow-lg border border-border overflow-hidden">
                            <Image
                                src={post.comic.coverImageUrl || '/placeholder-cover.svg'}
                                alt={post.comic.title}
                                fill
                                className="object-cover"
                                onError={(e) => { e.currentTarget.src = '/placeholder-cover.svg'; }}
                                sizes="48px"
                            />
                        </div>
                        <h2 className="text-lg font-bold text-foreground drop-shadow-md">
                            c/{post.comic.title}
                        </h2>
                    </div>
                </div>
            )}

            {/* Post Content */}
            <div className="p-6 border-b border-border">
                <div className="flex gap-4">
                    {/* Vote Column */}
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                        <button
                            onClick={() => handleVote(1)}
                            aria-label="Upvote post"
                            className={[
                                'p-1.5 rounded-lg transition-all active:scale-75',
                                userVote === 1 ? 'text-vote-up bg-vote-up/10' : 'text-muted-foreground hover:text-vote-up hover:bg-vote-up/10',
                            ].join(' ')}
                        >
                            <ArrowBigUp size={28} fill={userVote === 1 ? 'currentColor' : 'none'} />
                        </button>
                        <span className={`font-bold text-lg tabular-nums ${postScoreColor}`}>{post?.score ?? 0}</span>
                        <button
                            onClick={() => handleVote(-1)}
                            aria-label="Downvote post"
                            className={[
                                'p-1.5 rounded-lg transition-all active:scale-75',
                                userVote === -1 ? 'text-vote-down bg-vote-down/10' : 'text-muted-foreground hover:text-vote-down hover:bg-vote-down/10',
                            ].join(' ')}
                        >
                            <ArrowBigDown size={28} fill={userVote === -1 ? 'currentColor' : 'none'} />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-foreground mb-4 leading-snug">{post?.title}</h1>
                        <div className="text-foreground/80 mb-6 text-sm leading-relaxed">
                            {post?.content && <RichTextParser content={post.content} />}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full border border-border">
                                <MessageSquare size={14} />
                                {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                            </div>
                            <button
                                onClick={() => navigator.clipboard.writeText(window.location.href)}
                                className="flex items-center gap-1.5 hover:bg-accent hover:text-accent-foreground px-3 py-1.5 rounded-full transition-colors"
                            >
                                <Share2 size={14} />
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comment Input */}
            <div className="p-6 bg-card/50">
                <form onSubmit={handleCommentSubmit} className="mb-8">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="What are your thoughts?"
                        className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-h-[100px] resize-none transition-colors"
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            type="submit"
                            disabled={!newComment.trim() || submitting}
                            className="bg-brand hover:bg-brand/90 text-brand-foreground font-semibold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? 'Posting…' : 'Comment'}
                        </button>
                    </div>
                </form>

                {/* Comments List */}
                <div className="space-y-1">
                    {comments.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-8">No comments yet. Be the first!</p>
                    ) : (
                        comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                postId={postId}
                                depth={0}
                                onReplySuccess={fetchComments}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
