import { NextResponse } from 'next/server';
import { PrismaClient, Origin, Status } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse all filter parameters
    const type = searchParams.get('type');
    const statusParam = searchParams.get('status') as Status | null;
    const search = searchParams.get('search');
    const includedTags = searchParams.get('included')?.split(',').filter(Boolean).map(Number) || [];
    const excludedTags = searchParams.get('excluded')?.split(',').filter(Boolean).map(Number) || [];
    const originsParam = searchParams.get('origins')?.split(',').filter(Boolean) as Origin[] | undefined;
    const sort = searchParams.get('sort') || 'latest';

    const where: any = {};

    // Type filter
    if (type) {
      where.type = type;
    }

    // Status filter (enum-based)
    if (statusParam) {
      where.status = statusParam;
    }

    // Origin filter (multiple)
    if (originsParam && originsParam.length > 0) {
      where.origin = { in: originsParam };
    }

    // Text search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Boolean tag filtering
    if (includedTags.length > 0 || excludedTags.length > 0) {
      where.AND = [];

      // Include: comic must have ALL included tags
      if (includedTags.length > 0) {
        includedTags.forEach((tagId) => {
          where.AND.push({
            tags: {
              some: { tagId },
            },
          });
        });
      }

      // Exclude: comic must NOT have ANY excluded tags
      if (excludedTags.length > 0) {
        where.AND.push({
          tags: {
            none: {
              tagId: { in: excludedTags },
            },
          },
        });
      }
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };

    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const comics = await prisma.comic.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            chapters: true,
            reviews: true,
          },
        },
      },
      orderBy,
    });

    // Calculate recommendation percentage for each comic
    const comicsWithStats = await Promise.all(
      comics.map(async (comic) => {
        if (comic._count.reviews > 0) {
          const reviews = await prisma.review.findMany({
            where: { comicId: comic.id },
            select: { recommend: true },
          });

          const recommendCount = reviews.filter((r) => r.recommend).length;
          const recommendPercent = Math.round((recommendCount / reviews.length) * 100);

          return {
            ...comic,
            recommendPercent,
          };
        }

        return {
          ...comic,
          recommendPercent: 0,
        };
      })
    );

    return NextResponse.json(comicsWithStats);
  } catch (error) {
    console.error('Error fetching comics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, status, description, tags, origin = 'JP' } = body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const comic = await prisma.comic.create({
      data: {
        title,
        slug,
        type,
        status,
        origin,
        description,
        tags: {
          create: tags?.map((tagId: number) => ({
            tag: {
              connect: { id: tagId },
            },
          })),
        },
      },
    });

    return NextResponse.json(comic, { status: 201 });
  } catch (error) {
    console.error('Error creating comic:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
