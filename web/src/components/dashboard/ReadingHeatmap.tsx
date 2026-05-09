'use client';

import { useMemo, useState } from 'react';
import { subDays, format, eachDayOfInterval, startOfDay, isSameDay, getDay } from 'date-fns';

interface ReadingHeatmapProps {
    data: { date: string; count: number }[];
    loading: boolean;
}

export default function ReadingHeatmap({ data, loading }: ReadingHeatmapProps) {
    const [showHeatmap, setShowHeatmap] = useState(false);

    const today = startOfDay(new Date());
    const startDate = subDays(today, 364); // Last 365 days

    const calendarData = useMemo(() => {
        const days = eachDayOfInterval({ start: startDate, end: today });
        return days.map(day => {
            const stat = data.find(d => isSameDay(new Date(d.date), day));
            return {
                date: day,
                count: stat ? stat.count : 0
            };
        });
    }, [data, startDate, today]);

    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-800';
        if (count <= 2) return 'bg-green-900';
        if (count <= 5) return 'bg-green-700';
        if (count <= 10) return 'bg-green-500';
        return 'bg-green-300';
    };

    if (loading) return <div className="h-32 bg-gray-800/50 rounded-lg animate-pulse mb-8" />;

    // Group by weeks for the grid
    const weeks: ({ date: Date; count: number } | null)[][] = [];
    let currentWeek: ({ date: Date; count: number } | null)[] = [];

    // Pad the beginning if start date isn't Sunday
    const startDay = getDay(startDate);
    for (let i = 0; i < startDay; i++) {
        currentWeek.push(null);
    }

    calendarData.forEach((day) => {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    // Fill the last week with nulls if incomplete
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push(currentWeek);
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Reading Activity</h3>
                <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                    {showHeatmap ? 'Hide Graph' : 'Show Graph'}
                </button>
            </div>

            {showHeatmap && (
                <div className="overflow-x-auto animate-fade-in">
                    <div className="flex gap-1 min-w-max pb-2">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {week.map((day, dayIndex) => (
                                    day ? (
                                        <div
                                            key={day.date.toISOString()}
                                            className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-colors hover:ring-1 hover:ring-white/50 relative group`}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap">
                                                <div className="bg-gray-950 text-white text-xs py-1 px-2 rounded shadow-lg border border-gray-700">
                                                    {day.count} chapters on {format(day.date, 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={`empty-${weekIndex}-${dayIndex}`} className="w-3 h-3 rounded-sm bg-gray-800/20" />
                                    )
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
                        <span>Less</span>
                        <div className="w-3 h-3 rounded-sm bg-gray-800" />
                        <div className="w-3 h-3 rounded-sm bg-green-900" />
                        <div className="w-3 h-3 rounded-sm bg-green-700" />
                        <div className="w-3 h-3 rounded-sm bg-green-500" />
                        <div className="w-3 h-3 rounded-sm bg-green-300" />
                        <span>More</span>
                    </div>
                </div>
            )}
        </div>
    );
}
