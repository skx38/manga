import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { commentId, value } = await request.json();
        if (!commentId || value === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingVote = await prisma.vote.findUnique({
            where: { userId_commentId: { userId, commentId } },
        });

        if (existingVote) {
            if (existingVote.value === value) {
                await prisma.vote.delete({ where: { id: existingVote.id } });
            } else {
                await prisma.vote.update({ where: { id: existingVote.id }, data: { value } });
            }
        } else {
            await prisma.vote.create({ data: { userId, commentId, value } });
        }

        const votes = await prisma.vote.findMany({ where: { commentId } });
        const score = votes.reduce((acc, v) => acc + v.value, 0);

        return NextResponse.json({ score });
    } catch (error) {
        console.error('Error voting on comment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
