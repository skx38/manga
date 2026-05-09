'use client';

import { useState, useEffect } from 'react';
import { Folder, Plus, BookOpen, CheckCircle, Clock, XCircle, Bookmark, Share2 } from 'lucide-react';
import { LibraryStatus } from './StatusDropdown';

interface FolderType {
    id: string;
    name: string;
    _count?: { comics: number };
    isPublic?: boolean;
    shareId?: string;
}

const STATUS_ITEMS = [
    { status: 'READING', label: 'Reading', icon: BookOpen, color: 'text-status-reading' },
    { status: 'PLAN_TO_READ', label: 'Plan to Read', icon: Bookmark, color: 'text-warning' },
    { status: 'COMPLETED', label: 'Completed', icon: CheckCircle, color: 'text-status-completed' },
    { status: 'ON_HOLD', label: 'On Hold', icon: Clock, color: 'text-warning' },
    { status: 'DROPPED', label: 'Dropped', icon: XCircle, color: 'text-status-dropped' },
] as const;

export default function FolderList({ onSelectFolder, selectedFolderId, onSelectStatus, selectedStatus }: {
    onSelectFolder: (id: string | null) => void;
    selectedFolderId: string | null;
    onSelectStatus: (status: LibraryStatus | null) => void;
    selectedStatus: LibraryStatus | null;
}) {
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    useEffect(() => { fetchFolders(); }, []);

    const fetchFolders = async () => {
        const res = await fetch('/api/folders');
        if (res.ok) setFolders(await res.json());
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
            const res = await fetch(`/api/folders/${folder.id}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublic: !folder.isPublic }),
            });
            if (res.ok) {
                const updated = await res.json();
                setFolders(folders.map(f => f.id === folder.id ? updated : f));
                if (updated.isPublic && updated.shareId) {
                    navigator.clipboard.writeText(`${window.location.origin}/folder/${updated.shareId}`);
                    alert('Folder is now public! Link copied to clipboard.');
                } else {
                    alert('Folder is now private.');
                }
            }
        } catch (error) {
            console.error('Failed to toggle share', error);
        }
    };

    const navBtn = (active: boolean) =>
        `w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            active
                ? 'bg-brand/10 text-brand font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`;

    return (
        <div className="space-y-2">
            {/* All Comics */}
            <div className="space-y-0.5">
                <button onClick={() => { onSelectFolder(null); onSelectStatus(null); }} className={navBtn(!selectedFolderId && !selectedStatus)}>
                    <Folder size={16} />
                    <span>All Comics</span>
                </button>
            </div>

            {/* Status Tabs */}
            <div className="pt-4 space-y-2">
                <div className="px-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">Status</div>
                <div className="space-y-0.5">
                    {STATUS_ITEMS.map((item) => (
                        <button
                            key={item.status}
                            onClick={() => { onSelectStatus(item.status as LibraryStatus); onSelectFolder(null); }}
                            className={navBtn(selectedStatus === item.status)}
                        >
                            <item.icon
                                size={16}
                                className={selectedStatus === item.status ? item.color : 'text-muted-foreground'}
                            />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Folders */}
            <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between px-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    <span>Folders</span>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="hover:text-foreground transition-colors"
                        aria-label="Create folder"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {isCreating && (
                    <div className="px-2">
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') createFolder();
                                if (e.key === 'Escape') { setIsCreating(false); setNewFolderName(''); }
                            }}
                            placeholder="Folder name…"
                            className="w-full bg-muted text-sm text-foreground px-2 py-1.5 rounded border border-border focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-colors"
                            autoFocus
                        />
                    </div>
                )}

                <div className="space-y-0.5">
                    {folders.map(folder => (
                        <div key={folder.id} className="group relative flex items-center">
                            <button
                                onClick={() => onSelectFolder(folder.id)}
                                className={navBtn(selectedFolderId === folder.id)}
                            >
                                <Folder size={16} />
                                <span className="flex-1 text-left truncate">{folder.name}</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleShare(folder); }}
                                className={`absolute right-2 p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity ${folder.isPublic ? 'text-brand opacity-100' : 'text-muted-foreground'}`}
                                title={folder.isPublic ? 'Public — click to make private' : 'Private — click to share'}
                            >
                                <Share2 size={13} />
                            </button>
                        </div>
                    ))}

                    {folders.length === 0 && !isCreating && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No folders yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
