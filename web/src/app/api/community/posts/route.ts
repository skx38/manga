import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { rateLimit } from '@/lib/rateLimit';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const comicId = searchParams.get('comicId');
        const sort = searchParams.get('sort') || 'hot';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 10;
        const skip = (page - 1) * limit;

        if (id) {
            const post = await prisma.post.findUnique({
                where: { id },
                include: {
                    user: { select: { username: true, id: true } },
                    comic: { select: { title: true, slug: true, coverImageUrl: true, contentRating: true } },
                    _count: { select: { comments: true, votes: true } },
                    votes: true,
                },
            });

            if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

            const postWithRelations = post as any;
            const upvotes = postWithRelations.votes.filter((v: any) => v.value === 1).length;
            const downvotes = postWithRelations.votes.filter((v: any) => v.value === -1).length;
            const currentUserId = await getCurrentUserIdOrDemo() ?? '';
            const userVote = postWithRelations.votes.find((v: any) => v.userId === currentUserId)?.value || 0;

            return NextResponse.json({
                ...post,
                score: upvotes - downvotes,
                userVote,
                coverUrl: postWithRelations.comic?.coverImageUrl || '/placeholder-cover.png',
            });
        }

        const currentUserId = await getCurrentUserIdOrDemo() ?? '';
        const time = searchParams.get('time') || 'all'; // day, week, month, all

        // 1. Build Base Query
        const where: any = {};
        if (comicId) {
            where.comicId = comicId;
        }

        // Handle Time Filtering for "Top" sort
        if (sort === 'top' && time !== 'all') {
            const now = new Date();
            let timeFilter = new Date();

            switch (time) {
                case 'day':
                    timeFilter.setDate(now.getDate() - 1);
                    break;
                case 'week':
                    timeFilter.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    timeFilter.setMonth(now.getMonth() - 1);
                    break;
            }

            where.createdAt = { gte: timeFilter };
        }

        // 2. Handle "Home" Feed (Personalized)
        if (sort === 'home') {
            // Fetch user's library
            const libraryEntries = await prisma.libraryEntry.findMany({
                where: { userId: currentUserId },
                select: { comicId: true }
            });
            const followedComicIds = libraryEntries.map(e => e.comicId);

            if (followedComicIds.length > 0) {
                where.comicId = { in: followedComicIds };
            } else {
                // Fallback if no library: show nothing or popular? Let's show nothing for "Home" to encourage adding.
                // Or maybe show popular as fallback? Let's stick to strict "Home" definition.
                where.comicId = 'none'; // Hack to return empty
            }
        }

        // 3. Handle "Rising" (Recent posts)
        if (sort === 'rising') {
            const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
            where.createdAt = { gte: fourHoursAgo };
        }

        // 4. Fetch Posts (Initial Fetch)
        // For "Popular" and "Top", we need to fetch more to sort in memory if we can't do it in DB easily.
        // Prisma doesn't support complex computed sorting (like Reddit's hot algo) natively in one query without raw SQL.
        // For MVP, we'll fetch a larger batch and sort in memory, or use raw SQL.
        // Let's use in-memory sort for simplicity on small scale.

        const fetchLimit = sort === 'popular' || sort === 'top' ? 100 : limit; // Fetch more for ranking

        const posts = await prisma.post.findMany({
            where,
            include: {
                user: { select: { username: true, id: true } },
                comic: { select: { title: true, slug: true, coverImageUrl: true, contentRating: true } },
                _count: { select: { comments: true, votes: true } },
                votes: true,
            },
            orderBy: sort === 'new' ? { createdAt: 'desc' } : undefined,
            take: fetchLimit,
            skip: sort === 'new' || sort === 'home' ? skip : 0, // Pagination handled after sort for others
        });

        // 5. Transform & Calculate Scores
        let transformedPosts = posts.map((post: any) => {
            const upvotes = post.votes.filter((v: any) => v.value === 1).length;
            const downvotes = post.votes.filter((v: any) => v.value === -1).length;
            const score = upvotes - downvotes;
            const userVote = post.votes.find((v: any) => v.userId === currentUserId)?.value || 0;

            return {
                ...post,
                score,
                userVote,
                coverUrl: post.comic?.coverImageUrl || '/placeholder-cover.png',
            };
        });

        // 6. Apply Sorting Algorithms
        if (sort === 'top') {
            transformedPosts.sort((a, b) => b.score - a.score);
        }
        else if (sort === 'popular') {
            // Reddit-style Hot Algorithm (Simplified)
            // Score = (Upvotes + Comments) / (Time + 2)^Gravity
            const gravity = 1.8;
            const now = Date.now();

            transformedPosts.sort((a, b) => {
                const ageA = (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60); // Hours
                const ageB = (now - new Date(b.createdAt).getTime()) / (1000 * 60 * 60);

                // Add comments to weight engagement
                const scoreA = (a.score + a._count.comments) / Math.pow(ageA + 2, gravity);
                const scoreB = (b.score + b._count.comments) / Math.pow(ageB + 2, gravity);

                return scoreB - scoreA;
            });
        }
        else if (sort === 'rising') {
            // Already filtered by time, just sort by score
            transformedPosts.sort((a, b) => b.score - a.score);
        }

        // 7. Apply Pagination (for memory-sorted lists)
        if (sort === 'popular' || sort === 'top' || sort === 'rising') {
            transformedPosts = transformedPosts.slice(skip, skip + limit);
        }

        return NextResponse.json(transformedPosts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const limit = rateLimit(userId, 'post.create', 5, 60_000);
        if (!limit.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

        const body = await request.json();
        const { title, content, comicId, flair } = body;

        if (!title || !comicId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: { title, content: content || "", comicId, userId, flair },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, title, content, flair } = body;
        if (!id) return NextResponse.json({ error: 'Missing post id' }, { status: 400 });

        const post = await prisma.post.findUnique({ where: { id }, select: { userId: true } });
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        if (post.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const data: any = { editedAt: new Date() };
        if (typeof title === 'string' && title.trim()) data.title = title;
        if (typeof content === 'string') data.content = content;
        if (typeof flair === 'string' || flair === null) data.flair = flair;

        const updated = await prisma.post.update({ where: { id }, data });
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating post:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing post id' }, { status: 400 });

        const post = await prisma.post.findUnique({ where: { id }, select: { userId: true } });
        if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        if (post.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Soft-delete so vote tallies and comment threads survive.
        const updated = await prisma.post.update({
            where: { id },
            data: { isDeleted: true, content: '[deleted]', title: '[deleted]' },
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
