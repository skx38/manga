import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { rateLimit } from '@/lib/rateLimit';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const limit = rateLimit(userId, 'vote', 60, 60_000);
        if (!limit.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

        const { postId, value } = await request.json();
        if (!postId || value === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingVote = await prisma.vote.findUnique({
            where: { userId_postId: { userId, postId } },
        });

        if (existingVote) {
            if (existingVote.value === value) {
                await prisma.vote.delete({ where: { id: existingVote.id } });
            } else {
                await prisma.vote.update({ where: { id: existingVote.id }, data: { value } });
            }
        } else {
            await prisma.vote.create({ data: { userId, postId, value } });
        }

        const votes = await prisma.vote.findMany({ where: { postId } });
        const score = votes.reduce((acc, v) => acc + v.value, 0);

        return NextResponse.json({ score });
    } catch (error) {
        console.error('Error voting on post:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
