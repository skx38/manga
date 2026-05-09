'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, Eye, EyeOff } from 'lucide-react';
import styles from './PostCard.module.css';

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
            // Switch vote
            newScore = score - userVote + value;
        }

        // Optimistic update
        setScore(newScore);
        setUserVote(newUserVote);

        try {
            await fetch('/api/community/posts/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error(error);
            // Revert on error
            setScore(previousScore);
            setUserVote(previousUserVote);
        }
    };

    const isSpoilerOrNsfw = (post.spoiler || post.nsfw) && !revealed;
    const commentCount = post._count?.comments || 0;

    const cardClasses = [
        styles['post-card'],
        compact && styles['post-card--compact'],
        highlighted && styles['post-card--highlighted']
    ].filter(Boolean).join(' ');

    return (
        <article className={cardClasses}>
            {/* Vote Column */}
            <div className={styles['post-card__vote-column']}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleVote(1);
                    }}
                    className={`${styles['post-card__vote-button']} ${styles['post-card__vote-button--up']} ${userVote === 1 ? styles['post-card__vote-button--active'] : ''}`}
                    aria-label="Upvote"
                >
                    <ArrowBigUp size={24} fill={userVote === 1 ? 'currentColor' : 'none'} />
                </button>

                <span className={`${styles['post-card__score']} ${score > 0 ? styles['post-card__score--positive'] : score < 0 ? styles['post-card__score--negative'] : ''}`}>
                    {score}
                </span>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleVote(-1);
                    }}
                    className={`${styles['post-card__vote-button']} ${styles['post-card__vote-button--down']} ${userVote === -1 ? styles['post-card__vote-button--active'] : ''}`}
                    aria-label="Downvote"
                >
                    <ArrowBigDown size={24} fill={userVote === -1 ? 'currentColor' : 'none'} />
                </button>
            </div>

            {/* Content */}
            <div className={styles['post-card__content']}>
                {/* Header */}
                <header className={styles['post-card__header']}>
                    {post.comic && (
                        <>
                            <Link href={`/comic/${post.comic.id}`} className={styles['post-card__comic-link']}>
                                {post.comic.coverImage && (
                                    <div className={styles['post-card__comic-avatar']}>
                                        <Image
                                            src={post.comic.coverImage}
                                            alt={post.comic.title}
                                            fill
                                            className={styles['post-card__comic-image']}
                                        />
                                    </div>
                                )}
                                <span className={styles['post-card__comic-name']}>{post.comic.title}</span>
                            </Link>
                            <span className={styles['post-card__separator']}>•</span>
                        </>
                    )}
                    <span>Posted by</span>
                    <Link href={`/user/${post.user.id}`} className={styles['post-card__author-link']}>
                        <span className={styles['post-card__author-name']}>u/{post.user.username}</span>
                    </Link>
                    <span className={styles['post-card__separator']}>•</span>
                    <time className={styles['post-card__timestamp']}>
                        {new Date(post.createdAt).toLocaleDateString()}
                    </time>
                    {post.type && post.type !== 'TEXT' && (
                        <span className={styles['post-card__context-badge']}>
                            {post.type}
                        </span>
                    )}
                </header>

                {/* Body */}
                <div className={`${styles['post-card__body']} ${isSpoilerOrNsfw ? styles['post-card__body--blurred'] : ''} ${onClick ? styles['post-card__clickable'] : ''}`}>
                    {onClick ? (
                        <div onClick={onClick} className={styles['post-card__link']}>
                            <h3 className={styles['post-card__title']}>{post.title}</h3>
                            {post.content && !compact && (
                                <p className={styles['post-card__text']}>
                                    {post.content.length > 200 ? `${post.content.slice(0, 200)}...` : post.content}
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <h3 className={styles['post-card__title']}>{post.title}</h3>
                            {post.content && !compact && (
                                <p className={styles['post-card__text']}>
                                    {post.content.length > 200 ? `${post.content.slice(0, 200)}...` : post.content}
                                </p>
                            )}
                        </>
                    )}

                    {/* Blur Overlay */}
                    {isSpoilerOrNsfw && (
                        <div className={styles['post-card__blur-overlay']}>
                            <div className={styles['post-card__blur-notice']}>
                                <EyeOff className={styles['post-card__blur-icon']} size={20} />
                                <span className={styles['post-card__blur-text']}>
                                    {post.spoiler ? 'Spoiler' : 'NSFW'}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRevealed(true);
                                    }}
                                    className="ml-2 text-blue-400 hover:underline text-sm pointer-events-auto"
                                >
                                    <Eye size={16} className="inline mr-1" />
                                    Reveal
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className={styles['post-card__footer']}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick?.();
                        }}
                        className={styles['post-card__action-button']}
                    >
                        <MessageSquare size={16} />
                        <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
                    </button>

                    <button className={styles['post-card__action-button']}>
                        <Share2 size={16} />
                        <span>Share</span>
                    </button>

                    <button className={styles['post-card__action-button']}>
                        <Bookmark size={16} />
                        <span>Save</span>
                    </button>

                    {post.flair && (
                        <span className={styles['post-card__flair']}>
                            {post.flair}
                        </span>
                    )}

                    {post.comic && (
                        <Link
                            href={`/reader/${post.comic.id}/1`}
                            className={styles['post-card__read-button']}
                            onClick={(e) => e.stopPropagation()}
                        >
                            📖 Read
                        </Link>
                    )}
                </footer>
            </div>
        </article>
    );
}
