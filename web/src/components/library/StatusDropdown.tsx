'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';

export type LibraryStatus = 'READING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED' | 'PLAN_TO_READ';

interface StatusDropdownProps {
    comicId: string;
    currentStatus?: LibraryStatus | null;
    onStatusChange?: (status: LibraryStatus | null) => void;
    comicDetails?: {
        title: string;
        coverUrl: string;
        type: string;
    };
}

const STATUS_OPTIONS: { value: LibraryStatus; label: string }[] = [
    { value: 'READING', label: 'Reading' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ON_HOLD', label: 'On-Hold' },
    { value: 'DROPPED', label: 'Dropped' },
    { value: 'PLAN_TO_READ', label: 'Plan to Read' },
];

export default function StatusDropdown({ comicId, currentStatus, onStatusChange, comicDetails }: StatusDropdownProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<LibraryStatus | null>(currentStatus || null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSelect = async (newStatus: LibraryStatus | null) => {
        setIsOpen(false);
        if (newStatus === status) return;

        setStatus(newStatus);
        setIsLoading(true);

        try {
            const response = await fetch('/api/library/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comicId,
                    status: newStatus,
                    details: comicDetails
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            // Force a router refresh to refetch server component data
            router.refresh();

            if (onStatusChange) onStatusChange(newStatus);
        } catch (error) {
            console.error('Failed to update status', error);
            setStatus(status); // Revert
        } finally {
            setIsLoading(false);
        }
    };

    const currentLabel = status ? STATUS_OPTIONS.find(o => o.value === status)?.label : 'Add to Library';

    return (
        <div className="relative">
            <button
                onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${status
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                disabled={isLoading}
            >
                <span>{isLoading ? 'Updating...' : currentLabel}</span>
                <ChevronDown size={16} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-[160px] bg-[#222529] border border-gray-700 rounded-md shadow-xl z-50 overflow-hidden">
                    {status && (
                        <button
                            onClick={(e) => { e.preventDefault(); handleSelect(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                        >
                            Unfollow
                        </button>
                    )}

                    {STATUS_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={(e) => { e.preventDefault(); handleSelect(option.value); }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${status === option.value
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            {option.label}
                            {status === option.value && <Check size={14} />}
                        </button>
                    ))}
                </div>
            )}

            {/* Backdrop to close */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={(e) => { e.preventDefault(); setIsOpen(false); }} />
            )}
        </div>
    );
}
