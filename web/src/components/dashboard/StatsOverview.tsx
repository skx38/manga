'use client';

import { Flame, BookOpen, Calendar, Trophy } from 'lucide-react';

interface StatsOverviewProps {
    stats: {
        totalChapters: number;
        daysActive: number;
        currentStreak: number;
        longestStreak: number;
    } | null;
    loading: boolean;
}

export default function StatsOverview({ stats, loading }: StatsOverviewProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-lg p-4 h-24 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const items = [
        {
            label: 'Current Streak',
            value: `${stats.currentStreak} Days`,
            icon: Flame,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20'
        },
        {
            label: 'Total Chapters',
            value: stats.totalChapters,
            icon: BookOpen,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        },
        {
            label: 'Days Active',
            value: stats.daysActive,
            icon: Calendar,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20'
        },
        {
            label: 'Longest Streak',
            value: `${stats.longestStreak} Days`,
            icon: Trophy,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {items.map((item) => (
                <div key={item.label} className={`bg-gray-900 border ${item.border} rounded-lg p-4 flex items-center gap-4`}>
                    <div className={`p-3 rounded-full ${item.bg}`}>
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</div>
                        <div className="text-xl font-bold text-white">{item.value}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
