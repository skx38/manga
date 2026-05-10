'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';
import Image from 'next/image';

interface Comic {
    id: string;
    title: string;
    slug: string;
    coverImageUrl: string;
}

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedComic?: Comic; // Optional: if opened from a comic page
    onPostCreated?: () => void;
}

export default function CreatePostModal({ isOpen, onClose, preselectedComic, onPostCreated }: CreatePostModalProps) {
    const [step, setStep] = useState<'select-comic' | 'write-post'>(preselectedComic ? 'write-post' : 'select-comic');
    const [selectedComic, setSelectedComic] = useState<Comic | null>(preselectedComic || null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Comic[]>([]);
    const [searching, setSearching] = useState(false);

    // Post State
    const [postType, setPostType] = useState<'text' | 'link' | 'image'>('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            if (preselectedComic) {
                setStep('write-post');
                setSelectedComic(preselectedComic);
            } else {
                setStep('select-comic');
                setSelectedComic(null);
                setSearchQuery('');
                setSearchResults([]);
            }
            setTitle('');
            setContent('');
            setLinkUrl('');
            setImageUrl('');
            setPostType('text');
        }
    }, [isOpen, preselectedComic]);

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }

            setSearching(true);
            try {
                // Reuse existing search API
                const res = await fetch(`/api/comics?search=${encodeURIComponent(searchQuery)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(Array.isArray(data) ? data : (data.comics || []));
                }
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectComic = (comic: Comic) => {
        setSelectedComic(comic);
        setStep('write-post');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedComic || !title.trim()) return;

        // Compose content + flair from post type. The schema has no Post.url
        // field, so links and images are encoded as markdown the existing
        // RichTextParser already understands.
        let composedContent = content;
        let flair: string | undefined;
        if (postType === 'link') {
            if (!linkUrl.trim()) return;
            composedContent = `[${title}](${linkUrl})\n\n${content}`.trim();
            flair = 'Link';
        } else if (postType === 'image') {
            if (!imageUrl.trim()) return;
            composedContent = `![${title}](${imageUrl})\n\n${content}`.trim();
            flair = 'Image';
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/community/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content: composedContent,
                    comicId: selectedComic.id,
                    flair,
                }),
            });

            if (res.ok) {
                onClose();
                if (onPostCreated) {
                    onPostCreated();
                } else {
                    // Fallback if no callback provided
                    window.location.reload();
                }
            }
        } catch (error) {
            console.error('Failed to create post', error);
            alert('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white">Create a Post</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'select-comic' ? (
                        <div className="space-y-4">
                            <h3 className="text-gray-300 text-sm font-medium">Choose a community to post in</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search for a comic..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    autoFocus
                                />
                            </div>

                            <div className="min-h-[300px]">
                                {searching ? (
                                    <div className="flex items-center justify-center py-12 text-gray-500">
                                        <Loader2 className="animate-spin mr-2" size={20} />
                                        Searching...
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {searchResults.map((comic) => (
                                            <button
                                                key={comic.id}
                                                onClick={() => handleSelectComic(comic)}
                                                className="w-full flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition-colors text-left group"
                                            >
                                                <div className="w-10 h-14 relative rounded overflow-hidden bg-gray-800 flex-shrink-0">
                                                    <Image
                                                        src={comic.coverImageUrl || '/placeholder-cover.png'}
                                                        alt={comic.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-200 group-hover:text-white">c/{comic.title}</div>
                                                    <div className="text-xs text-gray-500">{comic.slug}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : searchQuery.length > 1 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        No communities found matching "{searchQuery}"
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-600 text-sm">
                                        Type to search for a manga series
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Selected Context */}
                            <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-12 relative rounded overflow-hidden bg-gray-800 flex-shrink-0">
                                        <Image
                                            src={selectedComic?.coverImageUrl || '/placeholder-cover.png'}
                                            alt={selectedComic?.title || ''}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">Posting in</div>
                                        <div className="font-bold text-white text-sm">c/{selectedComic?.title}</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep('select-comic')}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium px-3 py-1 hover:bg-blue-900/20 rounded-full transition-colors"
                                >
                                    Change
                                </button>
                            </div>

                            {/* Post type tabs */}
                            <div className="flex gap-1 border-b border-gray-800 -mt-2">
                                {([
                                    { id: 'text' as const, icon: FileText, label: 'Text' },
                                    { id: 'link' as const, icon: LinkIcon, label: 'Link' },
                                    { id: 'image' as const, icon: ImageIcon, label: 'Image' },
                                ]).map(({ id, icon: Icon, label }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setPostType(id)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                            postType === id
                                                ? 'border-blue-500 text-white'
                                                : 'border-transparent text-gray-500 hover:text-gray-300'
                                        }`}
                                    >
                                        <Icon size={16} /> {label}
                                    </button>
                                ))}
                            </div>

                            <input
                                type="text"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-transparent border border-gray-700 rounded-lg px-4 py-3 text-lg font-bold text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
                                maxLength={300}
                                autoFocus
                            />

                            {postType === 'link' && (
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="w-full bg-gray-800/30 border border-gray-700 rounded-lg px-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
                                    required
                                />
                            )}

                            {postType === 'image' && (
                                <input
                                    type="url"
                                    placeholder="Image URL (https://…)"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="w-full bg-gray-800/30 border border-gray-700 rounded-lg px-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
                                    required
                                />
                            )}

                            <div className="relative">
                                <textarea
                                    id="post-content"
                                    placeholder={postType === 'text' ? 'Text (optional)' : 'Description (optional)'}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full bg-gray-800/30 border border-gray-700 rounded-lg p-4 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-600 min-h-[200px] resize-none font-mono text-sm"
                                />
                                {/* Formatting Tools */}
                                <div className="absolute bottom-3 left-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
                                            if (textarea) {
                                                const start = textarea.selectionStart;
                                                const end = textarea.selectionEnd;
                                                const text = textarea.value;
                                                const before = text.substring(0, start);
                                                const after = text.substring(end, text.length);
                                                const newText = before + "![Alt text](url)" + after;
                                                setContent(newText);
                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.setSelectionRange(start + 2, start + 10);
                                                }, 0);
                                            }
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
                                        title="Add Image"
                                    >
                                        <ImageIcon size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const textarea = document.getElementById('post-content') as HTMLTextAreaElement;
                                            if (textarea) {
                                                const start = textarea.selectionStart;
                                                const end = textarea.selectionEnd;
                                                const text = textarea.value;
                                                const before = text.substring(0, start);
                                                const after = text.substring(end, text.length);
                                                const newText = before + "[Link text](url)" + after;
                                                setContent(newText);
                                                setTimeout(() => {
                                                    textarea.focus();
                                                    textarea.setSelectionRange(start + 1, start + 10);
                                                }, 0);
                                            }
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
                                        title="Add Link"
                                    >
                                        <LinkIcon size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!title.trim() || submitting}
                                    className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submitting && <Loader2 className="animate-spin" size={16} />}
                                    Post
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
