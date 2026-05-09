'use client';

import { Check, X } from 'lucide-react';

export type TagStatus = 'neutral' | 'include' | 'exclude';

interface TagSelectorProps {
    tag: { id: number; name: string };
    status: TagStatus;
    onChange: (status: TagStatus) => void;
}

export default function TagSelector({ tag, status, onChange }: TagSelectorProps) {
    const handleClick = () => {
        if (status === 'neutral') onChange('include');
        else if (status === 'include') onChange('exclude');
        else onChange('neutral');
    };

    const getStyles = () => {
        switch (status) {
            case 'include':
                return 'bg-green-600/20 text-green-400 border-green-600/50 hover:bg-green-600/30';
            case 'exclude':
                return 'bg-red-600/20 text-red-400 border-red-600/50 hover:bg-red-600/30';
            default:
                return 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-200';
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${getStyles()}`}
        >
            {status === 'include' && <Check size={14} />}
            {status === 'exclude' && <X size={14} />}
            {tag.name}
        </button>
    );
}
