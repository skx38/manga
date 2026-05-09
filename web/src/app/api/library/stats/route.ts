import { NextResponse } from 'next/server';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { PrismaClient } from '@prisma/client';
import { startOfDay, subDays, differenceInDays, isSameDay } from 'date-fns';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Fetch all reading stats for the user, ordered by date
        const stats = await prisma.userReadingStat.findMany({
            where: { userId },
            orderBy: { date: 'asc' }
        });

        // 2. Calculate Total Chapters
        const totalChapters = stats.reduce((acc, curr) => acc + curr.chaptersRead, 0);

        // 3. Calculate Days Active
        const daysActive = stats.length;

        // 4. Calculate Streaks
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Sort by date just to be safe (though query is ordered)
        const sortedStats = [...stats].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Longest Streak Calculation
        for (let i = 0; i < sortedStats.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const prevDate = new Date(sortedStats[i - 1].date);
                const currDate = new Date(sortedStats[i].date);
                const diff = differenceInDays(currDate, prevDate);

                if (diff === 1) {
                    tempStreak++;
                } else if (diff > 1) {
                    tempStreak = 1;
                }
                // If diff === 0 (same day), do nothing (shouldn't happen with unique constraint)
            }
            if (tempStreak > longestStreak) longestStreak = tempStreak;
        }

        // Current Streak Calculation
        const today = startOfDay(new Date());
        const yesterday = subDays(today, 1);

        // Check if we read today
        const readToday = sortedStats.some(s => isSameDay(new Date(s.date), today));
        // Check if we read yesterday
        const readYesterday = sortedStats.some(s => isSameDay(new Date(s.date), yesterday));

        if (readToday || readYesterday) {
            // We have an active streak potentially.
            // Walk backwards from the last entry
            let streakCount = 0;
            let checkDate = readToday ? today : yesterday;

            for (let i = sortedStats.length - 1; i >= 0; i--) {
                const statDate = new Date(sortedStats[i].date);
                if (isSameDay(statDate, checkDate)) {
                    streakCount++;
                    checkDate = subDays(checkDate, 1);
                } else if (statDate < checkDate) {
                    // Gap found
                    break;
                }
            }
            currentStreak = streakCount;
        } else {
            currentStreak = 0;
        }

        // 5. Format Heatmap Data (Last 365 Days)
        // We'll return the raw stats, frontend can map them to the calendar grid
        const heatmapData = stats.map(s => ({
            date: s.date,
            count: s.chaptersRead
        }));

        return NextResponse.json({
            stats: {
                totalChapters,
                daysActive,
                currentStreak,
                longestStreak
            },
            heatmap: heatmapData
        });

    } catch (error) {
        console.error('Error fetching reading stats:', error);
        return NextResponse.json({ error: 'Failed to fetch reading stats' }, { status: 500 });
    }
}
