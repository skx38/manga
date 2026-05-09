'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Eye, Send, Smile, HelpCircle, MoreVertical, Trash2, Edit2, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextParser from '../shared/RichTextParser';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { username: string; id: string };
    score: number;
    isSpoiler: boolean;
    isDeleted: boolean;
    isEdited: boolean;
    replies?: Comment[];
}

interface CommentSectionProps {
    chapterId: string;
    isBlurred: boolean;
    onUnblur: () => void;
}

const EMOJI_LIST = ['😀', '😂', '😍', '🔥', '😭', '😱', '👍', '👎', '❤️', '🤔'];

export default function CommentSection({ chapterId, isBlurred, onUnblur }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
            console.error('Failed to fetch comments:', error);
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
                    content: newComment,
                    chapterId,
                    isSpoiler: false // Deprecated checkbox
                }),
            });

            if (res.ok) {
                const comment = await res.json();
                setComments([comment, ...comments]);
                setNewComment('');
                setShowEmojiPicker(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const insertEmoji = (emoji: string) => {
        setNewComment(prev => prev + emoji);
    };

    const updateCommentInTree = (comments: Comment[], targetId: string, update: Partial<Comment>): Comment[] => {
        return comments.map(c => {
            if (c.id === targetId) {
                return { ...c, ...update };
            }
            if (c.replies) {
                return { ...c, replies: updateCommentInTree(c.replies, targetId, update) };
            }
            return c;
        });
    };

    const handleDelete = async (commentId: string) => {
        // Optimistic update
        setComments(prev => updateCommentInTree(prev, commentId, { isDeleted: true, content: '[deleted]' }));

        try {
            const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
            if (!res.ok) {
                console.error('Failed to delete');
                fetchComments(); // Refetch to sync if failed
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleEdit = async (commentId: string, newContent: string) => {
        // Optimistic update
        setComments(prev => updateCommentInTree(prev, commentId, { content: newContent, isEdited: true }));

        try {
            const res = await fetch('/api/comments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: commentId, content: newContent }),
            });

            if (!res.ok) {
                fetchComments();
            }
        } catch (error) {
            console.error('Failed to edit comment:', error);
        }
    };

    const handleVote = async (commentId: string) => {
        // Optimistic update (toggle +1)
        // Note: This is a simple toggle for now. Real implementation needs to track user's current vote state.
        // For now, we'll just assume +1

        try {
            const res = await fetch('/api/comments/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commentId,
                    value: 1
                }),
            });

            if (res.ok) {
                const { score } = await res.json();
                setComments(prev => updateCommentInTree(prev, commentId, { score }));
            }
        } catch (error) {
            console.error('Failed to vote:', error);
        }
    };

    const handleReply = async (parentId: string, content: string) => {
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    chapterId,
                    parentId,
                }),
            });

            if (res.ok) {
                const newReply = await res.json();
                // Helper to insert reply into tree
                const insertReply = (nodes: Comment[]): Comment[] => {
                    return nodes.map(node => {
                        if (node.id === parentId) {
                            return { ...node, replies: [...(node.replies || []), newReply] };
                        }
                        if (node.replies) {
                            return { ...node, replies: insertReply(node.replies) };
                        }
                        return node;
                    });
                };
                setComments(prev => insertReply(prev));
            }
        } catch (error) {
            console.error('Failed to reply:', error);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#1a1d21]">
            {/* Blur Overlay */}
            {isBlurred && (
                <div
                    className="absolute inset-0 z-20 backdrop-blur-md bg-black/50 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-opacity duration-300"
                    onClick={onUnblur}
                >
                    <Eye size={48} className="text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Comments Hidden</h3>
                    <p className="text-gray-300 text-sm">
                        Finish reading the chapter or click here to view the discussion.
                    </p>
                </div>
            )}

            {/* Content (Scrollable) */}
            <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 transition-filter duration-300 ${isBlurred ? 'blur-sm pointer-events-none' : ''}`}>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="mb-6 relative">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
                        <div className="flex-1 relative">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Leave a comment..."
                                className="w-full bg-[#222529] border border-gray-700 rounded-md py-2 pl-3 pr-10 text-sm text-gray-200 focus:outline-none focus:border-blue-500 min-h-[80px] resize-none"
                            />

                            {/* Toolbar */}
                            <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="text-gray-400 hover:text-yellow-400 transition-colors"
                                    >
                                        <Smile size={18} />
                                    </button>

                                    {showEmojiPicker && (
                                        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg p-2 shadow-xl grid grid-cols-5 gap-1 w-48 z-50">
                                            {EMOJI_LIST.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => insertEmoji(emoji)}
                                                    className="p-2 hover:bg-gray-700 rounded text-xl"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Comments List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center text-gray-500 py-8">Loading comments...</div>
                    ) : comments.length > 0 ? (
                        comments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                onReply={handleReply}
                                onVote={handleVote}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                            <p>No comments yet. Be the first to share your thoughts!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CommentItem({ comment, onReply, onVote, onDelete, onEdit }: {
    comment: Comment,
    onReply: (parentId: string, content: string) => void,
    onVote: (id: string) => void,
    onDelete: (id: string) => void,
    onEdit: (id: string, content: string) => void
}) {
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [editContent, setEditContent] = useState(comment.content);
    const [showActions, setShowActions] = useState(false);

    const isOwner = false; // TODO: compare with useSession().data?.user?.id

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyContent.trim()) {
            onReply(comment.id, replyContent);
            setIsReplying(false);
            setReplyContent('');
        }
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editContent.trim()) {
            onEdit(comment.id, editContent);
            setIsEditing(false);
        }
    };

    if (comment.isDeleted) {
        return (
            <div className="pl-4 border-l-2 border-gray-800 py-2">
                <p className="text-gray-600 text-sm italic">[Comment deleted]</p>
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4">
                        {comment.replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} onReply={onReply} onVote={onVote} onDelete={onDelete} onEdit={onEdit} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="group">
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {comment.user.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-200">{comment.user.username}</span>
                        <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                        {comment.isEdited && <span className="text-xs text-gray-600 italic">(edited)</span>}
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleEditSubmit} className="mb-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-[#222529] border border-gray-700 rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 min-h-[60px]"
                            />
                            <div className="flex gap-2 mt-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="text-xs text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-sm text-gray-300 leading-relaxed break-words mb-2">
                            <RichTextParser content={comment.content} />
                        </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button
                            onClick={() => onVote(comment.id)}
                            className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                        >
                            <ThumbsUp size={14} />
                            <span>{comment.score || 0}</span>
                        </button>
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                            <MessageSquare size={14} />
                            <span>Reply</span>
                        </button>

                        {isOwner && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowActions(!showActions)}
                                    className="hover:text-white transition-colors p-1"
                                >
                                    <MoreVertical size={14} />
                                </button>
                                {showActions && (
                                    <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-xl z-10 py-1 min-w-[100px]">
                                        <button
                                            onClick={() => { setIsEditing(true); setShowActions(false); }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-gray-300"
                                        >
                                            <Edit2 size={12} /> Edit
                                        </button>
                                        <button
                                            onClick={() => { onDelete(comment.id); setShowActions(false); }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-red-400"
                                        >
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {isReplying && (
                        <form onSubmit={handleReplySubmit} className="mt-3 mb-4 pl-4 border-l-2 border-gray-700">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full bg-[#222529] border border-gray-700 rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 min-h-[60px] mb-2"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsReplying(false)}
                                    className="text-xs text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
                                >
                                    Reply
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pl-4 border-l border-gray-800 space-y-4">
                    {comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} onReply={onReply} onVote={onVote} onDelete={onDelete} onEdit={onEdit} />
                    ))}
                </div>
            )}
        </div>
    );
}
