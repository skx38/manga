import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const library = await prisma.libraryEntry.findMany({
            where: { userId },
            include: {
                comic: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        coverImageUrl: true,
                        origin: true,
                        folders: {
                            where: {
                                folder: {
                                    userId: userId
                                }
                            },
                            include: {
                                folder: true
                            }
                        }
                    }
                }
            }
        });

        const exportData = library.map(entry => ({
            comic: {
                title: entry.comic.title,
                slug: entry.comic.slug,
                origin: entry.comic.origin
            },
            status: entry.status,
            progress: 0, // TODO: Fetch actual progress from ReadingProgress
            rating: entry.score || 0,
            folders: entry.comic.folders.map(fc => fc.folder.name),
            updatedAt: entry.updatedAt
        }));

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="omniread-export-${new Date().toISOString().split('T')[0]}.json"`
            }
        });

    } catch (error: any) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
