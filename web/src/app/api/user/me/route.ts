import { NextResponse } from 'next/server';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Ensure User Exists (and fetch basic stats)
        const user = await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                username: 'OmniReader_Demo',
                email: 'demo@omniread.com',
                level: 5,
                xp: 450,
                image: '/avatars/default.png'
            }
        });

        // 2. Calculate Karma (Votes received on Posts + Comments)
        // This is a bit heavy, so in a real app we'd cache this or update it incrementally.
        // For now, we'll do a simplified version or just count their activity as a proxy if it's too heavy.
        // Let's try to do it right:

        // Get all post IDs by user
        const posts = await prisma.post.findMany({
            where: { userId },
            select: { id: true }
        });
        const postIds = posts.map(p => p.id);

        // Get all comment IDs by user
        const comments = await prisma.comment.findMany({
            where: { userId },
            select: { id: true }
        });
        const commentIds = comments.map(c => c.id);

        // Sum votes on these posts and comments
        const postVotes = await prisma.vote.aggregate({
            where: { postId: { in: postIds } },
            _sum: { value: true }
        });

        const commentVotes = await prisma.vote.aggregate({
            where: { commentId: { in: commentIds } },
            _sum: { value: true }
        });

        const karma = (postVotes._sum.value || 0) + (commentVotes._sum.value || 0);

        // 3. Calculate Rank based on Level
        const getRank = (level: number) => {
            if (level < 5) return 'Novice';
            if (level < 10) return 'Apprentice';
            if (level < 20) return 'Adept';
            if (level < 50) return 'Master';
            return 'Legend';
        };

        // 4. Mock Notifications for now (or fetch if we had a table)
        const notifications = 3;

        return NextResponse.json({
            username: user.username,
            avatar: user.image || '/avatars/default.png',
            level: user.level,
            rank: getRank(user.level),
            xp: user.xp % 100, // Assuming 100 XP per level for display
            karma,
            notifications
        });

    } catch (error) {
        console.error('Failed to fetch user data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
