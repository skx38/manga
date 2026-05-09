'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, Filter, X, Calendar } from 'lucide-react';
import TagSelector, { TagStatus } from './TagSelector';
import { ORIGIN_COLORS } from '@/lib/constants';

interface Tag {
    id: number;
    name: string;
}

interface FilterPanelProps {
    availableTags: Tag[];
    basePath?: string;
}

export default function FilterPanel({ availableTags, basePath = '/search' }: FilterPanelProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);

    // Local state for filters (synced with URL)
    const [includedTags, setIncludedTags] = useState<number[]>([]);
    const [excludedTags, setExcludedTags] = useState<number[]>([]);
    const [origins, setOrigins] = useState<string[]>([]);
    const [pubStatuses, setPubStatuses] = useState<string[]>([]); // Renamed from status to avoid conflict
    const [contentRatings, setContentRatings] = useState<string[]>([]);
    const [minChapters, setMinChapters] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [sort, setSort] = useState<string>('latest');

    // Sync state from URL on mount and update
    useEffect(() => {
        const inc = searchParams.get('included')?.split(',').map(Number).filter(Boolean) || [];
        const exc = searchParams.get('excluded')?.split(',').map(Number).filter(Boolean) || [];
        const org = searchParams.get('origins')?.split(',').filter(Boolean) || [];
        const stat = searchParams.get('pubStatus')?.split(',').filter(Boolean) || []; // Use pubStatus
        const content = searchParams.get('content')?.split(',').filter(Boolean) || [];
        const chapters = searchParams.get('chapters') || '';
        const from = searchParams.get('from') || '';
        const to = searchParams.get('to') || '';
        const srt = searchParams.get('sort') || 'latest';

        setIncludedTags(inc);
        setExcludedTags(exc);
        setOrigins(org);
        setPubStatuses(stat);
        setContentRatings(content);
        setMinChapters(chapters);
        setDateFrom(from);
        setDateTo(to);
        setSort(srt);
    }, [searchParams]);

    const updateUrl = (
        newIncluded: number[],
        newExcluded: number[],
        newOrigins: string[],
        newPubStatuses: string[],
        newContent: string[],
        newChapters: string,
        newFrom: string,
        newTo: string,
        newSort: string
    ) => {
        const params = new URLSearchParams(searchParams.toString());

        if (newIncluded.length > 0) params.set('included', newIncluded.join(','));
        else params.delete('included');

        if (newExcluded.length > 0) params.set('excluded', newExcluded.join(','));
        else params.delete('excluded');

        if (newOrigins.length > 0) params.set('origins', newOrigins.join(','));
        else params.delete('origins');

        if (newPubStatuses.length > 0) params.set('pubStatus', newPubStatuses.join(','));
        else params.delete('pubStatus');

        if (newContent.length > 0) params.set('content', newContent.join(','));
        else params.delete('content');

        if (newChapters) params.set('chapters', newChapters);
        else params.delete('chapters');

        if (newFrom) params.set('from', newFrom);
        else params.delete('from');

        if (newTo) params.set('to', newTo);
        else params.delete('to');

        if (newSort !== 'latest') params.set('sort', newSort);
        else params.delete('sort');

        router.push(`${basePath}?${params.toString()}`);
    };

    const handleTagChange = (tagId: number, newStatus: TagStatus) => {
        let newIncluded = [...includedTags];
        let newExcluded = [...excludedTags];

        newIncluded = newIncluded.filter(id => id !== tagId);
        newExcluded = newExcluded.filter(id => id !== tagId);

        if (newStatus === 'include') newIncluded.push(tagId);
        if (newStatus === 'exclude') newExcluded.push(tagId);

        setIncludedTags(newIncluded);
        setExcludedTags(newExcluded);
        updateUrl(newIncluded, newExcluded, origins, pubStatuses, contentRatings, minChapters, dateFrom, dateTo, sort);
    };

    const toggleArrayItem = (current: string[], item: string) => {
        return current.includes(item)
            ? current.filter(i => i !== item)
            : [...current, item];
    };

    const handleOriginChange = (origin: string) => {
        const newOrigins = toggleArrayItem(origins, origin);
        setOrigins(newOrigins);
        updateUrl(includedTags, excludedTags, newOrigins, pubStatuses, contentRatings, minChapters, dateFrom, dateTo, sort);
    };

    const handlePubStatusChange = (status: string) => {
        const newStatuses = toggleArrayItem(pubStatuses, status);
        setPubStatuses(newStatuses);
        updateUrl(includedTags, excludedTags, origins, newStatuses, contentRatings, minChapters, dateFrom, dateTo, sort);
    };

    const handleContentChange = (rating: string) => {
        const newContent = toggleArrayItem(contentRatings, rating);
        setContentRatings(newContent);
        updateUrl(includedTags, excludedTags, origins, pubStatuses, newContent, minChapters, dateFrom, dateTo, sort);
    };

    const handleChaptersChange = (val: string) => {
        setMinChapters(val);
        updateUrl(includedTags, excludedTags, origins, pubStatuses, contentRatings, val, dateFrom, dateTo, sort);
    };

    const handleDateChange = (type: 'from' | 'to', val: string) => {
        const newFrom = type === 'from' ? val : dateFrom;
        const newTo = type === 'to' ? val : dateTo;
        if (type === 'from') setDateFrom(val); else setDateTo(val);
        updateUrl(includedTags, excludedTags, origins, pubStatuses, contentRatings, minChapters, newFrom, newTo, sort);
    };

    const handleSortChange = (newSort: string) => {
        setSort(newSort);
        updateUrl(includedTags, excludedTags, origins, pubStatuses, contentRatings, minChapters, dateFrom, dateTo, newSort);
    };

    const clearFilters = () => {
        setIncludedTags([]);
        setExcludedTags([]);
        setOrigins([]);
        setPubStatuses([]);
        setContentRatings([]);
        setMinChapters('');
        setDateFrom('');
        setDateTo('');
        setSort('latest');
        router.push(basePath);
    };

    const activeFilterCount = includedTags.length + excludedTags.length + origins.length + pubStatuses.length + contentRatings.length + (minChapters ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

    return (
        <div className="bg-gray-900 border-b border-gray-800">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 text-white font-bold hover:text-blue-400 transition-colors"
                    >
                        <Filter size={20} />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <div className="flex items-center gap-4">
                        <select
                            value={sort}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500"
                        >
                            <option value="latest">Latest Updates</option>
                            <option value="popular">Popular</option>
                            <option value="oldest">Oldest Added</option>
                            <option value="rating">Highest Rated</option>
                            <option value="title">A-Z</option>
                        </select>
                    </div>
                </div>

                {isOpen && (
                    <div className="mt-6 animate-fade-in space-y-6 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Origins */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Origin</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['JP', 'KR', 'CN'].map((origin) => (
                                        <button
                                            key={origin}
                                            onClick={() => handleOriginChange(origin)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${origins.includes(origin)
                                                ? `${ORIGIN_COLORS[origin]?.activeBg || 'bg-blue-600'} ${ORIGIN_COLORS[origin]?.activeBorder || 'border-blue-600'} text-white`
                                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                                }`}
                                        >
                                            {ORIGIN_COLORS[origin]?.label || origin}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Status</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['ONGOING', 'COMPLETED', 'HIATUS', 'CANCELLED'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handlePubStatusChange(s)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${pubStatuses.includes(s)
                                                ? 'bg-green-600 border-green-600 text-white'
                                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                                }`}
                                        >
                                            {s.charAt(0) + s.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Rating */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Content Rating</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['SAFE', 'SUGGESTIVE', 'EROTICA'].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => handleContentChange(r)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${contentRatings.includes(r)
                                                ? 'bg-purple-600 border-purple-600 text-white'
                                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                                                }`}
                                        >
                                            {r.charAt(0) + r.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chapters & Date */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Min Chapters</h3>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={minChapters}
                                        onChange={(e) => handleChaptersChange(e.target.value)}
                                        className="w-full bg-gray-800 text-white text-sm rounded-md px-3 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Release Date</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => handleDateChange('from', e.target.value)}
                                                className="w-full bg-gray-800 text-white text-xs rounded-md pl-2 pr-1 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <span className="text-gray-500">-</span>
                                        <div className="relative flex-1">
                                            <input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => handleDateChange('to', e.target.value)}
                                                className="w-full bg-gray-800 text-white text-xs rounded-md pl-2 pr-1 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="pt-4 border-t border-gray-800">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase">Tags</h3>
                                {(includedTags.length > 0 || excludedTags.length > 0) && (
                                    <button
                                        onClick={() => {
                                            setIncludedTags([]);
                                            setExcludedTags([]);
                                            updateUrl([], [], origins, pubStatuses, contentRatings, minChapters, dateFrom, dateTo, sort);
                                        }}
                                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                    >
                                        <X size={12} /> Reset Tags
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {availableTags.map((tag) => {
                                    let tagStatus: TagStatus = 'neutral';
                                    if (includedTags.includes(tag.id)) tagStatus = 'include';
                                    if (excludedTags.includes(tag.id)) tagStatus = 'exclude';

                                    return (
                                        <TagSelector
                                            key={tag.id}
                                            tag={tag}
                                            status={tagStatus}
                                            onChange={(newStatus) => handleTagChange(tag.id, newStatus)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Clear All */}
                        {activeFilterCount > 0 && (
                            <div className="pt-4 border-t border-gray-800 flex justify-end">
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-gray-400 hover:text-white underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
