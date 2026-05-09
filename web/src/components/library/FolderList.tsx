'use client';

import { useState, useEffect } from 'react';
import { Folder, Plus, Trash2, Edit2, BookOpen, CheckCircle, Clock, XCircle, Bookmark, Share2 } from 'lucide-react';
import { LibraryStatus } from './StatusDropdown';

interface FolderType {
    id: string;
    name: string;
    _count?: { comics: number };
    isPublic?: boolean;
    shareId?: string;
}

export default function FolderList({ onSelectFolder, selectedFolderId, onSelectStatus, selectedStatus }: {
    onSelectFolder: (id: string | null) => void,
    selectedFolderId: string | null,
    onSelectStatus: (status: LibraryStatus | null) => void,
    selectedStatus: LibraryStatus | null
}) {
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    useEffect(() => {
        fetchFolders();
    }, []);

    const fetchFolders = async () => {
        const res = await fetch('/api/folders');
        if (res.ok) {
            const data = await res.json();
            setFolders(data);
        }
    };

    const createFolder = async () => {
        if (!newFolderName.trim()) return;
        const res = await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newFolderName }),
        });
        if (res.ok) {
            setNewFolderName('');
            setIsCreating(false);
            fetchFolders();
        }
    };

    const toggleShare = async (folder: FolderType) => {
        try {
            const newIsPublic = !folder.isPublic;
            const res = await fetch(`/api/folders/${folder.id}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublic: newIsPublic }),
            });

            if (res.ok) {
                const updatedFolder = await res.json();
                setFolders(folders.map(f => f.id === folder.id ? updatedFolder : f));

                if (newIsPublic && updatedFolder.shareId) {
                    const url = `${window.location.origin}/folder/${updatedFolder.shareId}`;
                    navigator.clipboard.writeText(url);
                    alert('Folder is now public! Link copied to clipboard.');
                } else {
                    alert('Folder is now private.');
                }
            }
        } catch (error) {
            console.error('Failed to toggle share', error);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>Folders</span>
                <button onClick={() => setIsCreating(true)} className="hover:text-white">
                    <Plus size={14} />
                </button>
            </div>

            {isCreating && (
                <div className="px-2 mb-2">
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                        placeholder="Folder name..."
                        className="w-full bg-gray-800 text-sm text-white px-2 py-1 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        autoFocus
                    />
                </div>
            )}

            <div className="space-y-0.5">
                <button
                    onClick={() => onSelectFolder(null)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${selectedFolderId === null ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        }`}
                >
                    <Folder size={16} />
                    <span>All Comics</span>
                </button>
            </div>

            <div className="pt-4 space-y-2">
                <div className="px-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <span>Status</span>
                </div>
                <div className="space-y-0.5">
                    {[
                        { status: 'READING', label: 'Reading', icon: BookOpen, color: 'text-blue-400' },
                        { status: 'PLAN_TO_READ', label: 'Plan to Read', icon: Bookmark, color: 'text-yellow-400' },
                        { status: 'COMPLETED', label: 'Completed', icon: CheckCircle, color: 'text-green-400' },
                        { status: 'ON_HOLD', label: 'On Hold', icon: Clock, color: 'text-orange-400' },
                        { status: 'DROPPED', label: 'Dropped', icon: XCircle, color: 'text-red-400' },
                    ].map((item) => (
                        <button
                            key={item.status}
                            onClick={() => onSelectStatus(item.status as LibraryStatus)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${selectedStatus === item.status ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                        >
                            <item.icon size={16} className={selectedStatus === item.status ? item.color : ''} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between px-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <span>Custom Folders</span>
                    <button onClick={() => setIsCreating(true)} className="hover:text-white">
                        <Plus size={14} />
                    </button>
                </div>
                {folders.map(folder => (
                    <div key={folder.id} className="group relative flex items-center">
                        <button
                            onClick={() => onSelectFolder(folder.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${selectedFolderId === folder.id ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                }`}
                        >
                            <Folder size={16} />
                            <span className="flex-1 text-left truncate">{folder.name}</span>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleShare(folder); }}
                            className={`absolute right-2 p-1 rounded hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity ${folder.isPublic ? 'text-blue-400 opacity-100' : 'text-gray-500'}`}
                            title={folder.isPublic ? "Public (Click to disable)" : "Private (Click to share)"}
                        >
                            <Share2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
