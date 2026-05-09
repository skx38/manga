'use client';

import Link from 'next/link';

interface ComicInfoProps {
    comic: any;
}

export default function ComicInfo({ comic }: ComicInfoProps) {
    const authors = Array.isArray(comic.authors) ? comic.authors : [];
    const artists = Array.isArray(comic.artists) ? comic.artists : [];
    const publishers = Array.isArray(comic.publishers) ? comic.publishers : [];

    return (
        <div className="space-y-8">
            {/* Description */}
            <div>
                <h3 className="text-xl font-bold text-white mb-3">Description</h3>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                    {comic.description || 'No description available.'}
                </p>
            </div>

            {/* More Info Grid */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4">More Info</h3>
                <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                    {artists.length > 0 && (
                        <>
                            <span className="text-gray-500">Artists:</span>
                            <div className="flex flex-wrap gap-2">
                                {artists.map((artist: string, i: number) => (
                                    <span key={i} className="text-blue-400 hover:underline cursor-pointer">{artist}</span>
                                ))}
                            </div>
                        </>
                    )}

                    {authors.length > 0 && (
                        <>
                            <span className="text-gray-500">Authors:</span>
                            <div className="flex flex-wrap gap-2">
                                {authors.map((author: string, i: number) => (
                                    <span key={i} className="text-blue-400 hover:underline cursor-pointer">{author}</span>
                                ))}
                            </div>
                        </>
                    )}

                    <span className="text-gray-500">Genres:</span>
                    <div className="flex flex-wrap gap-2">
                        {comic.tags.filter((t: any) => t.tag.type === 'GENRE').map(({ tag }: any) => (
                            <span key={tag.id} className="text-blue-400 hover:underline cursor-pointer">
                                {tag.name}
                            </span>
                        ))}
                    </div>

                    <span className="text-gray-500">Theme:</span>
                    <div className="flex flex-wrap gap-2">
                        {comic.tags.filter((t: any) => t.tag.type === 'THEME').map(({ tag }: any) => (
                            <span key={tag.id} className="text-blue-400 hover:underline cursor-pointer">
                                {tag.name}
                            </span>
                        ))}
                    </div>

                    <span className="text-gray-500">Format:</span>
                    <div className="flex flex-wrap gap-2">
                        <span className="text-blue-400 hover:underline cursor-pointer">{comic.type}</span>
                        <span className="text-blue-400 hover:underline cursor-pointer">Full Color</span>
                    </div>

                    {publishers.length > 0 && (
                        <>
                            <span className="text-gray-500">Publishers:</span>
                            <div className="flex flex-wrap gap-2">
                                {publishers.map((pub: string, i: number) => (
                                    <span key={i} className="text-blue-400 hover:underline cursor-pointer">{pub}</span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Tags Cloud */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                    {comic.tags.map(({ tag }: any) => (
                        <span
                            key={tag.id}
                            className="px-3 py-1.5 rounded bg-gray-800 text-gray-300 text-xs hover:bg-gray-700 cursor-pointer transition-colors border border-gray-700"
                        >
                            {tag.name}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
