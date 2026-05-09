'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, EyeOff } from 'lucide-react';
import StatusDropdown, { LibraryStatus } from './library/StatusDropdown';
import AddToFolderDropdown from './library/AddToFolderDropdown';
import { usePreferences } from '@/context/PreferencesContext';

interface ComicCardProps {
    id: string;
    title: string;
    coverUrl: string;
    type: string;
    rating?: number;
    contentRating?: string;
    currentStatus?: LibraryStatus | null;
    folders?: { id: string; name: string }[];
    comicFolderIds?: string[];
    href?: string;
    readerUrl?: string;
}

export default function ComicCard({
    id, title, coverUrl, type, rating, contentRating,
    currentStatus, folders = [], comicFolderIds = [], href, readerUrl,
}: ComicCardProps) {
    const { adultFilter } = usePreferences();
    const comicLink = href || `/comic/${id}`;
    const validCoverUrl = coverUrl || '/placeholder-cover.svg';
    const isAdult = contentRating === 'EROTICA' || contentRating === 'SUGGESTIVE';
    const shouldBlur = adultFilter && isAdult;

    const typeBadgeColor: Record<string, string> = {
        Manga:   'bg-blue-600/90',
        Manhwa:  'bg-emerald-600/90',
        Manhua:  'bg-orange-600/90',
        Webtoon: 'bg-purple-600/90',
    };
    const badgeColor = typeBadgeColor[type] ?? 'bg-brand/90';

    const CoverImage = ({ className = '' }: { className?: string }) => (
        <div className={`aspect-cover w-full overflow-hidden bg-muted relative ${className}`}>
            <Image
                src={validCoverUrl}
                alt={title}
                fill
                className={`object-cover object-center transition-transform duration-[var(--duration-slow)] ease-[var(--ease-spring)] ${
                    shouldBlur ? 'blur-xl scale-110 opacity-40' : 'group-hover:scale-105'
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
            {/* Gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

            {shouldBlur && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-10">
                    <EyeOff size={28} className="mb-1.5" aria-hidden />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Adult Content</span>
                </div>
            )}
        </div>
    );

    const Meta = () => (
        <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10">
            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white mb-1 ${badgeColor}`}>
                {type}
            </span>
            <h3 className="clamp-2 text-xs font-semibold text-white drop-shadow leading-snug">{title}</h3>
            {rating != null && rating > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5 text-yellow-400">
                    <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
                    <span className="text-[10px] font-medium">{rating.toFixed(1)}</span>
                </div>
            )}
        </div>
    );

    const Overlay = () => (
        <div className="absolute top-1.5 right-1.5 z-20 flex flex-col gap-1.5 items-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-[var(--duration-fast)]">
            <div className="w-36 shadow-xl">
                <StatusDropdown
                    comicId={id}
                    currentStatus={currentStatus}
                    comicDetails={{ title, coverUrl: validCoverUrl, type }}
                />
            </div>
            <AddToFolderDropdown
                comicId={id}
                folders={folders}
                initialFolderIds={comicFolderIds}
                comicDetails={{ title, coverUrl: validCoverUrl, type }}
            />
        </div>
    );

    if (readerUrl) {
        return (
            <article className="group relative rounded-lg overflow-hidden ring-1 ring-border/50 hover:ring-brand/50 transition-all duration-[var(--duration-base)] hover:-translate-y-0.5">
                <Link href={readerUrl} className="block" aria-label={`Read ${title}`}>
                    <CoverImage />
                    <Meta />
                </Link>
                <Overlay />
            </article>
        );
    }

    return (
        <article className="group relative rounded-lg overflow-hidden ring-1 ring-border/50 hover:ring-brand/50 transition-all duration-[var(--duration-base)] hover:-translate-y-0.5">
            <Link href={comicLink} className="block" aria-label={title}>
                <CoverImage />
                <Meta />
            </Link>
            <Overlay />
        </article>
    );
}
