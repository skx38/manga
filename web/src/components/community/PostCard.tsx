'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, Eye, EyeOff, BookOpen } from 'lucide-react';

interface PostCardProps {
    post: {
        id: string;
        title: string;
        content?: string;
        comicId?: string;
        comic?: {
            id: string;
            title: string;
            coverImage?: string;
        };
        user: {
            id: string;
            username: string;
        };
        createdAt: string;
        score: number;
        userVote?: number;
        type?: string;
        flair?: string;
        spoiler?: boolean;
        nsfw?: boolean;
        _count?: {
            comments: number;
        };
    };
    onClick?: () => void;
    compact?: boolean;
    highlighted?: boolean;
}

export default function PostCard({ post, onClick, compact = false, highlighted = false }: PostCardProps) {
    const [score, setScore] = useState(post.score || 0);
    const [userVote, setUserVote] = useState(post.userVote || 0);
    const [revealed, setRevealed] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextSaved = !saved;
        setSaved(nextSaved);
        try {
            await fetch('/api/saved', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post.id }),
            });
        } catch {
            setSaved(!nextSaved);
        }
    };

    const handleVote = async (value: number) => {
        const previousScore = score;
        const previousVote = userVote;

        let newScore = score;
        let newVote = value;

        if (userVote === value) {
            newScore = score - value;
            newVote = 0;
        } else if (userVote === 0) {
            newScore = score + value;
        } else {
            newScore = score - userVote + value;
        }

        setScore(newScore);
        setUserVote(newVote);

        try {
            const res = await fetch('/api/community/posts/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post.id, value }),
            });
            if (res.ok) {
                const data = await res.json();
                setScore(data.score);
            } else {
                setScore(previousScore);
                setUserVote(previousVote);
            }
        } catch {
            setScore(previousScore);
            setUserVote(previousVote);
        }
    };

    const isSpoilerOrNsfw = (post.spoiler || post.nsfw) && !revealed;
    const commentCount = post._count?.comments || 0;
    const scoreColor = userVote === 1 ? 'text-vote-up' : userVote === -1 ? 'text-vote-down' : 'text-foreground';

    return (
        <article className={[
            'bg-card border rounded-xl overflow-hidden flex transition-colors',
            highlighted ? 'border-brand border-2' : 'border-border hover:border-border/80',
            compact ? 'flex-row items-center p-2' : '',
        ].filter(Boolean).join(' ')}>

            {/* Vote Column */}
            <div className={[
                'flex flex-col items-center gap-0.5 bg-muted/30',
                compact ? 'flex-row mr-3 bg-transparent' : 'p-2 w-12 border-r border-border',
            ].filter(Boolean).join(' ')}>
                <button
                    onClick={(e) => { e.stopPropagation(); handleVote(1); }}
                    aria-label="Upvote"
                    className={[
                        'p-1.5 rounded-md transition-all active:scale-75 min-w-[2.75rem] min-h-[2.75rem] flex items-center justify-center',
                        userVote === 1
                            ? 'text-vote-up bg-vote-up/10 hover:bg-vote-up/20'
                            : 'text-muted-foreground hover:text-vote-up hover:bg-vote-up/10',
                    ].join(' ')}
                >
                    <ArrowBigUp size={22} fill={userVote === 1 ? 'currentColor' : 'none'} />
                </button>

                <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>{score}</span>

                <button
                    onClick={(e) => { e.stopPropagation(); handleVote(-1); }}
                    aria-label="Downvote"
                    className={[
                        'p-1.5 rounded-md transition-all active:scale-75 min-w-[2.75rem] min-h-[2.75rem] flex items-center justify-center',
                        userVote === -1
                            ? 'text-vote-down bg-vote-down/10 hover:bg-vote-down/20'
                            : 'text-muted-foreground hover:text-vote-down hover:bg-vote-down/10',
                    ].join(' ')}
                >
                    <ArrowBigDown size={22} fill={userVote === -1 ? 'currentColor' : 'none'} />
                </button>
            </div>

            {/* Content */}
            <div className={`flex-1 relative ${compact ? '' : 'p-3'}`}>
                {/* Header */}
                <header className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 flex-wrap">
                    {post.comic && (
                        <>
                            <Link href={`/comic/${post.comic.id}`} className="font-semibold text-foreground hover:text-brand transition-colors flex items-center gap-1">
                                {post.comic.coverImage && (
                                    <div className="w-4 h-4 rounded-full overflow-hidden relative flex-shrink-0">
                                        <Image src={post.comic.coverImage} alt={post.comic.title} fill className="object-cover" />
                                    </div>
                                )}
                                <span className="truncate">{post.comic.title}</span>
                            </Link>
                            <span className="text-border">•</span>
                        </>
                    )}
                    <span>by</span>
                    <Link href={`/user/${post.user.id}`} className="hover:text-foreground transition-colors">
                        u/{post.user.username}
                    </Link>
                    <span className="text-border">•</span>
                    <time>{new Date(post.createdAt).toLocaleDateString()}</time>
                    {post.type && post.type !== 'TEXT' && (
                        <span className="ml-auto bg-brand/10 text-brand px-2 py-0.5 rounded-full text-xs font-semibold">
                            {post.type}
                        </span>
                    )}
                    {post.flair && (
                        <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs border border-border">
                            {post.flair}
                        </span>
                    )}
                </header>

                {/* Body */}
                <div className={`relative ${isSpoilerOrNsfw ? 'select-none' : ''} ${onClick ? 'cursor-pointer' : ''}`}>
                    <div className={isSpoilerOrNsfw ? 'blur-md opacity-40 pointer-events-none' : ''}>
                        {onClick ? (
                            <div onClick={onClick}>
                                <h3 className="text-base font-semibold text-foreground mb-1.5 hover:text-brand transition-colors leading-snug">{post.title}</h3>
                                {post.content && !compact && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {post.content}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                <h3 className="text-base font-semibold text-foreground mb-1.5 leading-snug">{post.title}</h3>
                                {post.content && !compact && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Spoiler/NSFW Overlay */}
                    {isSpoilerOrNsfw && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg pointer-events-auto">
                                <EyeOff size={16} className="text-destructive flex-shrink-0" />
                                <span className="text-sm font-semibold text-foreground">
                                    {post.spoiler ? 'Spoiler' : 'NSFW'}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
                                    className="flex items-center gap-1 text-xs text-brand hover:underline"
                                >
                                    <Eye size={14} />
                                    Reveal
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!compact && (
                    <footer className="flex items-center gap-1 text-muted-foreground text-xs mt-2 flex-wrap">
                        <button
                            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                            className="flex items-center gap-1.5 hover:bg-accent hover:text-accent-foreground px-2.5 py-1.5 rounded-md transition-colors min-h-[2.25rem]"
                        >
                            <MessageSquare size={14} />
                            <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
                        </button>

                        <button
                            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/community/post/${post.id}`)}
                            className="flex items-center gap-1.5 hover:bg-accent hover:text-accent-foreground px-2.5 py-1.5 rounded-md transition-colors min-h-[2.25rem]"
                        >
                            <Share2 size={14} />
                            <span>Share</span>
                        </button>

                        <button
                            onClick={handleSave}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors min-h-[2.25rem] ${
                                saved
                                    ? 'text-brand bg-brand/10 hover:bg-brand/20'
                                    : 'hover:bg-accent hover:text-accent-foreground'
                            }`}
                        >
                            <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
                            <span>{saved ? 'Saved' : 'Save'}</span>
                        </button>

                        {post.comic && (
                            <Link
                                href={`/reader/${post.comic.id}/1`}
                                onClick={(e) => e.stopPropagation()}
                                className="ml-auto flex items-center gap-1.5 bg-brand/10 text-brand hover:bg-brand/20 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                            >
                                <BookOpen size={13} />
                                Read
                            </Link>
                        )}
                    </footer>
                )}
            </div>
        </article>
    );
}
