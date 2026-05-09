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
    contentRating?: string; // "SAFE", "SUGGESTIVE", "EROTICA"
    currentStatus?: LibraryStatus | null;
    folders?: { id: string; name: string }[];
    comicFolderIds?: string[];
    href?: string; // Overrides the default link
    readerUrl?: string; // If present, splits the card: Image -> Reader, Info -> Comic
}

export default function ComicCard({ id, title, coverUrl, type, rating, contentRating, currentStatus, folders = [], comicFolderIds = [], href, readerUrl }: ComicCardProps) {
    const { adultFilter } = usePreferences();
    const comicLink = href || `/comic/${id}`;
    const validCoverUrl = coverUrl || '/placeholder-cover.svg';

    const isAdult = contentRating === 'EROTICA' || contentRating === 'SUGGESTIVE'; // Adjust based on strictness
    const shouldBlur = adultFilter && isAdult;

    const CardContent = () => (
        <>
            <div className="aspect-[2/3] w-full overflow-hidden bg-gray-800 relative group-hover:scale-105 transition-transform duration-300">
                <Image
                    src={validCoverUrl}
                    alt={title}
                    fill
                    className={`object-cover object-center transition-all duration-300 ${shouldBlur ? 'blur-xl scale-110 opacity-50' : 'group-hover:scale-110'}`}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

                {shouldBlur && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-10">
                        <EyeOff size={32} className="mb-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Adult Content</span>
                    </div>
                )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none z-20">
                <span className="mb-1 inline-block rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600">
                    {type}
                </span>
                <h3 className="line-clamp-2 text-sm font-bold text-white drop-shadow-md">
                    {title}
                </h3>
                {rating && (
                    <div className="mt-1 flex items-center text-xs text-yellow-400">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        <span>{rating}</span>
                    </div>
                )}
            </div>
        </>
    );

    if (readerUrl) {
        return (
            <div className="group relative rounded-lg overflow-hidden transition-all hover:scale-105">
                {/* Top Click Area (Reader) */}
                <Link href={readerUrl} className="block h-[85%] relative z-10">
                    <div className="aspect-[2/3] w-full overflow-hidden bg-gray-800 relative">
                        <Image
                            src={validCoverUrl}
                            alt={title}
                            fill
                            className={`object-cover object-center transition-transform duration-300 ${shouldBlur ? 'blur-xl scale-110 opacity-50' : 'group-hover:scale-110'}`}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

                        {shouldBlur && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-10">
                                <EyeOff size={32} className="mb-2" />
                                <span className="text-xs font-bold uppercase tracking-wider">Adult Content</span>
                            </div>
                        )}
                    </div>
                </Link>

                {/* Bottom Click Area (Comic Details) */}
                <Link href={comicLink} className="absolute bottom-0 left-0 right-0 h-[30%] z-20 flex flex-col justify-end p-3 bg-gradient-to-t from-black/90 to-transparent hover:from-black">
                    <span className="mb-1 inline-block w-fit rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600">
                        {type}
                    </span>
                    <h3 className="line-clamp-2 text-sm font-bold text-white drop-shadow-md">
                        {title}
                    </h3>
                    {rating && (
                        <div className="mt-1 flex items-center text-xs text-yellow-400">
                            <Star className="mr-1 h-3 w-3 fill-current" />
                            <span>{rating}</span>
                        </div>
                    )}
                </Link>

                <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-end pointer-events-auto">
                    <div className="w-36 shadow-lg">
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
            </div>
        );
    }

    return (
        <div className="group relative rounded-lg overflow-hidden transition-all hover:scale-105">
            <Link href={comicLink} className="block">
                <CardContent />
            </Link>

            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-end">
                <div className="w-36 shadow-lg">
                    <StatusDropdown comicId={id} currentStatus={currentStatus} />
                </div>
                <AddToFolderDropdown
                    comicId={id}
                    folders={folders}
                    initialFolderIds={comicFolderIds}
                    comicDetails={{ title, coverUrl: validCoverUrl, type }}
                />
            </div>
        </div>
    );
}
