'use client';

// import { Tooltip } from 'lucide-react'; // Removed unused import

interface ActivityHeatmapProps {
    data: { date: string; count: number }[];
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    // Generate last 365 days
    const today = new Date();
    const days: string[] = []; // Typed array
    for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }

    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-800';
        if (count < 3) return 'bg-green-900';
        if (count < 6) return 'bg-green-700';
        if (count < 10) return 'bg-green-500';
        return 'bg-green-400';
    };

    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="flex gap-1 min-w-max">
                {/* Simplified grid: 7 rows (days of week) x 52 columns (weeks) */}
                {/* For simplicity in this view, we'll just render a long strip or a grid if we calculate weeks */}
                {/* Let's do a proper GitHub style grid: Columns are weeks */}

                {Array.from({ length: 53 }).map((_, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                            const dayOfYearIndex = weekIndex * 7 + dayIndex;
                            if (dayOfYearIndex >= days.length) return null;

                            const dateStr = days[dayOfYearIndex];
                            const entry = data.find(d => d.date === dateStr);
                            const count = entry?.count || 0;

                            return (
                                <div
                                    key={dateStr}
                                    className={`w-3 h-3 rounded-sm ${getColor(count)}`}
                                    title={`${dateStr}: ${count} chapters`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
