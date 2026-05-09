'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, Check, Plus } from 'lucide-react';

interface FolderType {
    id: string;
    name: string;
}

interface AddToFolderDropdownProps {
    comicId: string;
    folders: FolderType[];
    initialFolderIds?: string[];
    comicDetails?: {
        title: string;
        coverUrl: string;
        type: string;
    };
}

export default function AddToFolderDropdown({ comicId, folders, initialFolderIds = [], comicDetails }: AddToFolderDropdownProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>(initialFolderIds);
    const [isLoading, setIsLoading] = useState(false);
    const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            setCloseTimeout(null);
        }
    };

    const handleMouseLeave = () => {
        const timeout = setTimeout(() => {
            setIsOpen(false);
        }, 300); // 300ms delay before closing
        setCloseTimeout(timeout);
    };

    const toggleFolder = async (folderId: string) => {
        const isSelected = selectedFolderIds.includes(folderId);
        const newSelected = isSelected
            ? selectedFolderIds.filter(id => id !== folderId)
            : [...selectedFolderIds, folderId];

        setSelectedFolderIds(newSelected);
        setIsLoading(true);

        try {
            const method = isSelected ? 'DELETE' : 'POST';
            await fetch(`/api/folders/${folderId}/comics`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comicId, details: comicDetails }),
            });
            router.refresh(); // Refresh to update library view
        } catch (error) {
            console.error('Failed to update folder', error);
            setSelectedFolderIds(selectedFolderIds); // Revert
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
                onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                title="Add to Folder"
            >
                <Folder size={16} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-[#222529] border border-gray-700 rounded-md shadow-xl z-50 overflow-hidden">
                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700">
                        Add to Folder
                    </div>

                    {folders.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No folders created
                        </div>
                    ) : (
                        <div className="max-h-48 overflow-y-auto">
                            {folders.map((folder) => {
                                const isSelected = selectedFolderIds.includes(folder.id);
                                return (
                                    <button
                                        key={folder.id}
                                        onClick={(e) => { e.preventDefault(); toggleFolder(folder.id); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center justify-between"
                                    >
                                        <span className="truncate">{folder.name}</span>
                                        {isSelected && <Check size={14} className="text-blue-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
