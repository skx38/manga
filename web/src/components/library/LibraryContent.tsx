'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ComicCard from '@/components/ComicCard';
import FolderList from './FolderList';
import { LibraryStatus } from './StatusDropdown';
import FilterPanel from '../search/FilterPanel';

export default function LibraryContent({ comics, folders }: any) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<LibraryStatus | null>(null);

    // Get filters from URL
    const includedTags = searchParams.get('included')?.split(',').map(Number).filter(Boolean) || [];
    const excludedTags = searchParams.get('excluded')?.split(',').map(Number).filter(Boolean) || [];
    const origins = searchParams.get('origins')?.split(',').filter(Boolean) || [];
    const sort = searchParams.get('sort') || 'latest';
    const statusFilter = searchParams.get('status') as LibraryStatus | null;

    // Collect all unique tags from comics for the filter panel
    const allTags = Array.from(new Set(comics.flatMap((c: any) => c.tags.map((t: any) => JSON.stringify(t.tag))))).map((t: any) => JSON.parse(t));
    const uniqueTags = Array.from(new Map(allTags.map((t: any) => [t.id, t])).values()).sort((a: any, b: any) => a.name.localeCompare(b.name));

    // Filter comics
    const filteredComics = comics.filter((comic: any) => {
        // Filter by Folder
        if (selectedFolderId) {
            const folder = folders.find((f: any) => f.id === selectedFolderId);
            if (!folder?.comics.some((fc: any) => fc.comicId === comic.id)) return false;
        }

        // Filter by Status (Sidebar selection)
        if (selectedStatus && comic.myStatus !== selectedStatus) return false;

        // Filter by Status (Filter Panel)
        // Note: FilterPanel status uses 'ONGOING'/'COMPLETED' (Comic Status), not Library Status
        // If we want to filter by Library Status via URL, we might need to adjust FilterPanel or handle it separately.
        // For now, let's assume FilterPanel filters by Comic Status (publishing status).
        if (statusFilter && comic.status !== statusFilter) return false;

        // Filter by Origins
        if (origins.length > 0 && !origins.includes(comic.origin)) return false;

        // Filter by Tags
        if (includedTags.length > 0) {
            const comicTagIds = comic.tags.map((t: any) => t.tag.id);
            if (!includedTags.every(id => comicTagIds.includes(id))) return false;
        }
        if (excludedTags.length > 0) {
            const comicTagIds = comic.tags.map((t: any) => t.tag.id);
            if (excludedTags.some(id => comicTagIds.includes(id))) return false;
        }

        return true;
    });

    // Sort comics
    const sortedComics = [...filteredComics].sort((a: any, b: any) => {
        switch (sort) {
            case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'rating': return (b.rating || 0) - (a.rating || 0);
            case 'title': return a.title.localeCompare(b.title);
            case 'latest': default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    return (
        <div className="flex min-h-screen bg-gray-950">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-800 p-4 hidden md:block">
                <h2 className="text-xl font-bold text-white mb-6 px-2">Library</h2>
                <FolderList
                    onSelectFolder={(id) => {
                        setSelectedFolderId(id);
                        setSelectedStatus(null);
                    }}
                    selectedFolderId={selectedFolderId}
                    onSelectStatus={(status) => { setSelectedStatus(status); setSelectedFolderId(null); }}
                    selectedStatus={selectedStatus}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">
                        {selectedFolderId
                            ? folders.find((f: any) => f.id === selectedFolderId)?.name
                            : selectedStatus
                                ? selectedStatus.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
                                : 'All Comics'}
                    </h1>
                    <span className="text-gray-400 text-sm">{sortedComics.length} items</span>
                </div>

                <div className="mb-6">
                    <FilterPanel availableTags={uniqueTags} basePath="/library" />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {sortedComics.map((comic: any) => (
                        <ComicCard
                            key={comic.id}
                            id={comic.id}
                            title={comic.title}
                            coverUrl={comic.coverImageUrl || '/placeholder-cover.png'}
                            type={comic.type}
                            rating={8.5}
                            currentStatus={comic.myStatus}
                            folders={folders}
                            comicFolderIds={comic.folderIds}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
