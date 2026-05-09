import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { reviewId, userId, type } = body;

        if (!reviewId || !userId || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if reaction exists
        const existingReaction = await prisma.reviewReaction.findUnique({
            where: {
                userId_reviewId_type: {
                    userId,
                    reviewId,
                    type,
                },
            },
        });

        if (existingReaction) {
            // Remove reaction (toggle off)
            await prisma.reviewReaction.delete({
                where: { id: existingReaction.id },
            });
            return NextResponse.json({ action: 'removed' });
        } else {
            // Add reaction (toggle on)
            await prisma.reviewReaction.create({
                data: {
                    userId,
                    reviewId,
                    type,
                },
            });
            return NextResponse.json({ action: 'added' });
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
