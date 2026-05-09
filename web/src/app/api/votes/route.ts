import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { targetId, targetType, voteType } = body;

        if (!targetId || !targetType || !voteType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (!['POST', 'COMMENT'].includes(targetType)) {
            return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });
        }
        if (!['UP', 'DOWN'].includes(voteType)) {
            return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
        }

        const existingVote = await prisma.vote.findFirst({
            where: {
                userId,
                ...(targetType === 'POST' ? { postId: targetId } : { commentId: targetId }),
            },
        });

        let result;

        if (existingVote) {
            if (existingVote.value === (voteType === 'UP' ? 1 : -1)) {
                await prisma.vote.delete({ where: { id: existingVote.id } });
                result = { action: 'removed', voteType: null };
            } else {
                await prisma.vote.update({
                    where: { id: existingVote.id },
                    data: { value: voteType === 'UP' ? 1 : -1 },
                });
                result = { action: 'updated', voteType };
            }
        } else {
            await prisma.vote.create({
                data: {
                    userId,
                    value: voteType === 'UP' ? 1 : -1,
                    ...(targetType === 'POST' ? { postId: targetId } : { commentId: targetId }),
                },
            });
            result = { action: 'created', voteType };
        }

        const votes = await prisma.vote.findMany({
            where: targetType === 'POST' ? { postId: targetId } : { commentId: targetId },
        });
        const upvotes = votes.filter(v => v.value === 1).length;
        const downvotes = votes.filter(v => v.value === -1).length;
        const score = upvotes - downvotes;
        const totalVotes = upvotes + downvotes;
        const controversyScore = totalVotes > 10 && Math.abs(score) < totalVotes * 0.2 ? totalVotes : 0;

        return NextResponse.json({
            success: true,
            ...result,
            score, upvotes, downvotes, totalVotes,
            isControversial: controversyScore > 20,
            upvotePercentage: totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0,
        });
    } catch (error) {
        console.error('Vote API error:', error);
        return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        const { searchParams } = new URL(request.url);
        const targetId = searchParams.get('targetId');
        const targetType = searchParams.get('targetType');

        if (!targetId || !targetType) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const userVote = userId
            ? await prisma.vote.findFirst({
                  where: {
                      userId,
                      ...(targetType === 'POST' ? { postId: targetId } : { commentId: targetId }),
                  },
              })
            : null;

        const votes = await prisma.vote.findMany({
            where: targetType === 'POST' ? { postId: targetId } : { commentId: targetId },
        });
        const upvotes = votes.filter(v => v.value === 1).length;
        const downvotes = votes.filter(v => v.value === -1).length;
        const score = upvotes - downvotes;
        const totalVotes = upvotes + downvotes;
        const controversyScore = totalVotes > 10 && Math.abs(score) < totalVotes * 0.2 ? totalVotes : 0;

        return NextResponse.json({
            userVote: userVote ? (userVote.value === 1 ? 'UP' : 'DOWN') : null,
            score, upvotes, downvotes, totalVotes,
            isControversial: controversyScore > 20,
            upvotePercentage: totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0,
        });
    } catch (error) {
        console.error('Vote API error:', error);
        return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
    }
}
