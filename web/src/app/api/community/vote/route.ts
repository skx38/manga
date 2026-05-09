import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, value, postId, commentId } = body;

        if (!userId || !value || (!postId && !commentId)) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Determine target
        const target = postId ? { postId } : { commentId };

        // Check for existing vote
        const existingVote = await prisma.vote.findFirst({
            where: {
                userId,
                ...target,
            },
        });

        if (existingVote) {
            if (existingVote.value === value) {
                // Toggle off (remove vote)
                await prisma.vote.delete({
                    where: { id: existingVote.id },
                });
                return NextResponse.json({ message: 'Vote removed' });
            } else {
                // Change vote
                const vote = await prisma.vote.update({
                    where: { id: existingVote.id },
                    data: { value },
                });
                return NextResponse.json(vote);
            }
        } else {
            // Create new vote
            const vote = await prisma.vote.create({
                data: {
                    userId,
                    value,
                    ...target,
                },
            });
            return NextResponse.json(vote, { status: 201 });
        }
    } catch (error) {
        console.error('Error voting:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
