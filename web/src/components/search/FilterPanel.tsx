'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, Filter, X, Calendar } from 'lucide-react';
import TagSelector, { TagStatus } from './TagSelector';
import { ORIGIN_COLORS } from '@/lib/constants';

interface Tag {
    id: number;
    name: string;
    type: string;  // "Genre" | "Theme" | "Demographic" | "Format" | etc.
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

                        {/* Tags grouped by category */}
                        <TagGroupsSection
                            availableTags={availableTags}
                            includedTags={includedTags}
                            excludedTags={excludedTags}
                            onTagChange={(tagId, newStatus) => handleTagChange(tagId, newStatus)}
                            onResetTags={() => {
                                setIncludedTags([]);
                                setExcludedTags([]);
                                updateUrl([], [], origins, pubStatuses, contentRatings, minChapters, dateFrom, dateTo, sort);
                            }}
                        />

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

// ── Tag groups accordion ────────────────────────────────────────────────

const TAG_CATEGORY_ORDER = ['Demographic', 'Format', 'Genre', 'Theme'];

function TagGroupsSection({
    availableTags,
    includedTags,
    excludedTags,
    onTagChange,
    onResetTags,
}: {
    availableTags: { id: number; name: string; type: string }[];
    includedTags: number[];
    excludedTags: number[];
    onTagChange: (tagId: number, status: TagStatus) => void;
    onResetTags: () => void;
}) {
    // Group tags by type
    const grouped = availableTags.reduce<Record<string, typeof availableTags>>(
        (acc, tag) => {
            const key = tag.type || 'Other';
            if (!acc[key]) acc[key] = [];
            acc[key].push(tag);
            return acc;
        },
        {}
    );

    // Sort category keys: known order first, then alphabetical
    const categories = Object.keys(grouped).sort((a, b) => {
        const ai = TAG_CATEGORY_ORDER.indexOf(a);
        const bi = TAG_CATEGORY_ORDER.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
    });

    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
        Object.fromEntries(categories.map((c, i) => [c, i < 2])) // open first 2
    );

    const toggle = (cat: string) =>
        setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

    const hasTagFilters = includedTags.length > 0 || excludedTags.length > 0;

    return (
        <div className="pt-4 border-t border-gray-800 space-y-2">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tags</h3>
                {hasTagFilters && (
                    <button
                        onClick={onResetTags}
                        className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1 transition-colors"
                    >
                        <X size={12} aria-hidden /> Reset tags
                    </button>
                )}
            </div>

            {/* Active tag chips */}
            {hasTagFilters && (
                <div className="flex flex-wrap gap-1.5 pb-2 mb-2 border-b border-gray-800">
                    {includedTags.map(id => {
                        const tag = availableTags.find(t => t.id === id);
                        if (!tag) return null;
                        return (
                            <button
                                key={`inc-${id}`}
                                onClick={() => onTagChange(id, 'neutral')}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success border border-success/40 hover:bg-success/30 transition-colors"
                                aria-label={`Remove include filter: ${tag.name}`}
                            >
                                <span>+</span>{tag.name}<X size={10} aria-hidden />
                            </button>
                        );
                    })}
                    {excludedTags.map(id => {
                        const tag = availableTags.find(t => t.id === id);
                        if (!tag) return null;
                        return (
                            <button
                                key={`exc-${id}`}
                                onClick={() => onTagChange(id, 'neutral')}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30 transition-colors"
                                aria-label={`Remove exclude filter: ${tag.name}`}
                            >
                                <span>−</span>{tag.name}<X size={10} aria-hidden />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Grouped accordion */}
            {categories.map(cat => (
                <div key={cat} className="rounded-md border border-gray-800 overflow-hidden">
                    <button
                        onClick={() => toggle(cat)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-foreground hover:bg-gray-800/50 transition-colors"
                        aria-expanded={openCategories[cat]}
                    >
                        <span>{cat}</span>
                        {openCategories[cat]
                            ? <ChevronUp size={14} aria-hidden />
                            : <ChevronDown size={14} aria-hidden />}
                    </button>
                    {openCategories[cat] && (
                        <div className="px-3 pb-3 pt-2 flex flex-wrap gap-2 border-t border-gray-800/60">
                            {grouped[cat].map(tag => {
                                let status: TagStatus = 'neutral';
                                if (includedTags.includes(tag.id)) status = 'include';
                                if (excludedTags.includes(tag.id)) status = 'exclude';
                                return (
                                    <TagSelector
                                        key={tag.id}
                                        tag={tag}
                                        status={status}
                                        onChange={s => onTagChange(tag.id, s)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
