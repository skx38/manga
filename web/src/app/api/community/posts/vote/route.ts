import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { postId, userId, value } = await request.json();

        if (!postId || !userId || value === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if vote already exists
        const existingVote = await prisma.vote.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });

        if (existingVote) {
            if (existingVote.value === value) {
                // Toggle off if same value
                await prisma.vote.delete({
                    where: { id: existingVote.id },
                });
            } else {
                // Change vote
                await prisma.vote.update({
                    where: { id: existingVote.id },
                    data: { value },
                });
            }
        } else {
            // Create new vote
            await prisma.vote.create({
                data: {
                    userId,
                    postId,
                    value,
                },
            });
        }

        // Calculate new score
        const votes = await prisma.vote.findMany({
            where: { postId },
        });
        const score = votes.reduce((acc, v) => acc + v.value, 0);

        return NextResponse.json({ score });

    } catch (error) {
        console.error('Error voting on post:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
