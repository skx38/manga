import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSimilarComics(comicId: string, limit: number = 10) {
    // 1. Get the tags of the current comic
    const currentComic = await prisma.comic.findUnique({
        where: { id: comicId },
        include: { tags: { include: { tag: true } } }
    });

    if (!currentComic || currentComic.tags.length === 0) {
        return [];
    }

    const tagIds = currentComic.tags.map(t => t.tagId);

    // 2. Find other comics that share these tags
    // Using Prisma findMany for safety with explicit relations



    const similar = await prisma.comic.findMany({
        where: {
            id: { not: comicId },
            tags: {
                some: {
                    tagId: { in: tagIds }
                }
            }
        },
        include: {
            tags: { include: { tag: true } }
        },
        take: limit * 2 // Fetch more to sort manually
    });

    // 3. Sort by number of matching tags + rating/views
    const sorted = similar.map(comic => {
        const matchCount = comic.tags.filter(t => tagIds.includes(t.tagId)).length;
        // Simple score: matches * 100 + rating * 10 + views / 1000
        const score = (matchCount * 100) + ((comic.rating || 0) * 10) + (((comic as any).views || 0) / 1000);
        return { ...comic, score };
    }).sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return sorted;
}

export async function getPersonalizedRecommendations(userId: string, limit: number = 10) {
    // 1. Get user's highly rated or read comics
    const userHistory = await prisma.libraryEntry.findMany({
        where: {
            userId,
            OR: [
                { status: { in: ['READING', 'COMPLETED'] } },
                { score: { gte: 7 } } // Liked comics
            ]
        },
        include: { comic: { include: { tags: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 20
    });

    if (userHistory.length === 0) {
        // Fallback to trending if no history
        return await prisma.comic.findMany({
            orderBy: { views: 'desc' },
            take: limit
        });
    }

    // 2. Aggregate tags from history
    const tagCounts: Record<string, number> = {};
    const readComicIds = new Set(userHistory.map(e => e.comicId));

    userHistory.forEach(entry => {
        entry.comic.tags.forEach(t => {
            tagCounts[t.tagId] = (tagCounts[t.tagId] || 0) + 1;
        });
    });

    // 3. Find top tags
    const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => parseInt(id));

    // 4. Find comics with these tags, excluding read ones
    const recommendations = await (prisma.comic as any).findMany({
        where: {
            id: { notIn: Array.from(readComicIds) },
            tags: {
                some: {
                    tagId: { in: topTags }
                }
            }
        },
        take: limit,
        orderBy: { rating: 'desc' } // Prioritize high rated ones
    });

    return recommendations;
}
