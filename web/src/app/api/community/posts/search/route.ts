import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';

const prisma = new PrismaClient();

/**
 * Search community posts by title/content. Optionally scoped to a single comic.
 * Uses Postgres ILIKE for now — upgrade to to_tsvector + GIN later if needed.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = (searchParams.get('q') || '').trim();
        const comicId = searchParams.get('comicId');
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

        if (q.length < 2) {
            return NextResponse.json([]);
        }

        const where: any = {
            isDeleted: false,
            isRemoved: false,
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { content: { contains: q, mode: 'insensitive' } },
            ],
        };
        if (comicId) where.comicId = comicId;

        const currentUserId = await getCurrentUserIdOrDemo() ?? '';
        const posts = await prisma.post.findMany({
            where,
            include: {
                user: { select: { username: true, id: true } },
                comic: { select: { title: true, slug: true, coverImageUrl: true, contentRating: true } },
                _count: { select: { comments: true, votes: true } },
                votes: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        const transformed = posts.map((post: any) => {
            const upvotes = post.votes.filter((v: any) => v.value === 1).length;
            const downvotes = post.votes.filter((v: any) => v.value === -1).length;
            return {
                ...post,
                score: upvotes - downvotes,
                userVote: post.votes.find((v: any) => v.userId === currentUserId)?.value || 0,
                coverUrl: post.comic?.coverImageUrl || '/placeholder-cover.png',
            };
        });

        return NextResponse.json(transformed);
    } catch (error) {
        console.error('Error searching posts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
