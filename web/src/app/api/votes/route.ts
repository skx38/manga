import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Hardcoded demo user for now (will be replaced with auth)
const DEMO_USER_ID = 'demo_user_id';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { targetId, targetType, voteType } = body;

        if (!targetId || !targetType || !voteType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!['POST', 'COMMENT'].includes(targetType)) {
            return NextResponse.json(
                { error: 'Invalid target type' },
                { status: 400 }
            );
        }

        if (!['UP', 'DOWN'].includes(voteType)) {
            return NextResponse.json(
                { error: 'Invalid vote type' },
                { status: 400 }
            );
        }

        // Check if user already voted
        const existingVote = await prisma.vote.findFirst({
            where: {
                userId: DEMO_USER_ID,
                ...(targetType === 'POST' ? { postId: targetId } : { commentId: targetId }),
            },
        });

        let result;
        let karmaChange = 0;

        if (existingVote) {
            if (existingVote.value === (voteType === 'UP' ? 1 : -1)) {
                // User clicked same vote - remove it
                await prisma.vote.delete({
                    where: { id: existingVote.id },
                });
                karmaChange = voteType === 'UP' ? -1 : 1; // Undo karma
                result = { action: 'removed', voteType: null };
            } else {
                // User changed their vote
                await prisma.vote.update({
                    where: { id: existingVote.id },
                    data: { value: voteType === 'UP' ? 1 : -1 },
                });
                karmaChange = voteType === 'UP' ? 2 : -2; // Swing from -1 to +1 or vice versa
                result = { action: 'updated', voteType };
            }
        } else {
            // New vote
            await prisma.vote.create({
                data: {
                    userId: DEMO_USER_ID,
                    value: voteType === 'UP' ? 1 : -1,
                    ...(targetType === 'POST' ? { postId: targetId } : { commentId: targetId }),
                },
            });
            karmaChange = voteType === 'UP' ? 1 : -1;
            result = { action: 'created', voteType };
        }

        // Calculate new vote counts
        const votes = await prisma.vote.findMany({
            where: targetType === 'POST' ? { postId: targetId } : { commentId: targetId },
        });

        const upvotes = votes.filter(v => v.value === 1).length;
        const downvotes = votes.filter(v => v.value === -1).length;
        const score = upvotes - downvotes;
        const totalVotes = upvotes + downvotes;

        // Calculate controversy score (high engagement, close to 0 score)
        const controversyScore = totalVotes > 10 && Math.abs(score) < totalVotes * 0.2
            ? totalVotes
            : 0;

        return NextResponse.json({
            success: true,
            ...result,
            score,
            upvotes,
            downvotes,
            totalVotes,
            isControversial: controversyScore > 20,
            upvotePercentage: totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0,
        });
    } catch (error) {
        console.error('Vote API error:', error);
        return NextResponse.json(
            { error: 'Failed to process vote' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const targetId = searchParams.get('targetId');
        const targetType = searchParams.get('targetType');

        if (!targetId || !targetType) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Get user's vote
        const userVote = await prisma.vote.findFirst({
            where: {
                userId: DEMO_USER_ID,
                ...(targetType === 'POST' ? { postId: targetId } : { commentId: targetId }),
            },
        });

        // Get vote counts
        const votes = await prisma.vote.findMany({
            where: targetType === 'POST' ? { postId: targetId } : { commentId: targetId },
        });

        const upvotes = votes.filter(v => v.value === 1).length;
        const downvotes = votes.filter(v => v.value === -1).length;
        const score = upvotes - downvotes;
        const totalVotes = upvotes + downvotes;

        // Controversy detection
        const controversyScore = totalVotes > 10 && Math.abs(score) < totalVotes * 0.2
            ? totalVotes
            : 0;

        return NextResponse.json({
            userVote: userVote ? (userVote.value === 1 ? 'UP' : 'DOWN') : null,
            score,
            upvotes,
            downvotes,
            totalVotes,
            isControversial: controversyScore > 20,
            upvotePercentage: totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0,
        });
    } catch (error) {
        console.error('Vote API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch votes' },
            { status: 500 }
        );
    }
}
