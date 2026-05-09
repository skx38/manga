
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { chapterId, pageNumber, scrollPercentage } = await request.json();
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get chapter to know the comicId
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            select: { comicId: true }
        });

        if (!chapter) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
        }

        // Upsert Reading Progress
        const progress = await prisma.readingProgress.upsert({
            where: {
                userId_chapterId: {
                    userId,
                    chapterId
                }
            },
            update: {
                pageNumber,
                scrollPercentage,
                lastRead: new Date()
            },
            create: {
                userId,
                chapterId,
                pageNumber,
                scrollPercentage,
                lastRead: new Date()
            }
        });

        // Ensure Comic is in Library as READING
        await prisma.libraryEntry.upsert({
            where: {
                userId_comicId: {
                    userId,
                    comicId: chapter.comicId
                }
            },
            update: {
                // Only update status if it's not already set (or maybe force READING?)
                // Usually reading a chapter implies READING.
                // But if it's COMPLETED, maybe we shouldn't change it back?
                // For now, let's leave status as is if it exists, or set to READING if new.
            },
            create: {
                userId,
                comicId: chapter.comicId,
                status: 'READING'
            }
        });

        // Update UserReadingStat if chapter is "completed" (e.g. > 85% scrolled)
        // We need to be careful not to double count.
        // Simple approach: If this specific ReadingProgress entry was NOT > 85% before, and now IS, increment stats.
        // However, we didn't fetch the *old* progress.
        // Alternative: Just check if we are saving > 85%.
        // But this would increment every 5 seconds while at the end of the chapter.
        // We need a "completed" flag or check the previous state.

        // Let's fetch the previous state first (we can optimize this later)
        const existingProgress = await prisma.readingProgress.findUnique({
            where: { userId_chapterId: { userId, chapterId } }
        });

        const wasCompleted = existingProgress && existingProgress.scrollPercentage > 0.85;
        const isCompleted = scrollPercentage > 0.85;

        if (isCompleted && !wasCompleted) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            await prisma.userReadingStat.upsert({
                where: { userId_date: { userId, date: today } },
                update: { chaptersRead: { increment: 1 } },
                create: { userId, date: today, chaptersRead: 1 },
            });

            // Streak update: fetch current streak state
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { streakDays: true, lastReadDate: true },
            });

            if (user) {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const lastDate = user.lastReadDate ? new Date(user.lastReadDate) : null;
                if (lastDate) lastDate.setHours(0, 0, 0, 0);

                let newStreak = user.streakDays;
                if (!lastDate || lastDate < yesterday) {
                    // Streak broken or first read — reset to 1
                    newStreak = 1;
                } else if (lastDate.getTime() === yesterday.getTime()) {
                    // Read yesterday — extend streak
                    newStreak = user.streakDays + 1;
                }
                // lastDate === today: already counted today, no change

                if (!lastDate || lastDate.getTime() !== today.getTime()) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: { streakDays: newStreak, lastReadDate: today },
                    });
                }
            }
        }

        return NextResponse.json(progress);
    } catch (error) {
        console.error('Error saving progress:', error);
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }
}
