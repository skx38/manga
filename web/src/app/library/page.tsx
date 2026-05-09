import { PrismaClient } from '@prisma/client';
import LibraryContent from '@/components/library/LibraryContent';

const prisma = new PrismaClient();

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

async function getData() {
    const userId = 'demo_user_id';

    // Fetch library entries, folders with comics
    const [libraryEntries, folders] = await Promise.all([
        (prisma as any).libraryEntry.findMany({
            where: { userId },
            include: {
                comic: {
                    include: {
                        tags: { include: { tag: true } }
                    }
                }
            }
        }),
        (prisma as any).folder.findMany({
            where: { userId },
            include: {
                comics: {
                    include: {
                        comic: {
                            include: {
                                tags: { include: { tag: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { order: 'asc' }
        })
    ]);

    // Get all unique comics from both library entries AND folders
    const comicMap = new Map();

    // Add comics from library entries
    libraryEntries.forEach((entry: any) => {
        const comic = entry.comic;
        comicMap.set(comic.id, {
            ...comic,
            myStatus: entry.status,
            folderIds: []
        });
    });

    // Add comics from folders (they might not be in library)
    folders.forEach((folder: any) => {
        folder.comics.forEach((fc: any) => {
            if (!comicMap.has(fc.comicId)) {
                comicMap.set(fc.comicId, {
                    ...fc.comic,
                    myStatus: null, // No library status
                    folderIds: []
                });
            }
        });
    });

    // Map folder IDs to each comic
    folders.forEach((folder: any) => {
        folder.comics.forEach((fc: any) => {
            const comic = comicMap.get(fc.comicId);
            if (comic && !comic.folderIds.includes(folder.id)) {
                comic.folderIds.push(folder.id);
            }
        });
    });

    const comics = Array.from(comicMap.values());
    return { comics, folders };
}

export default async function LibraryPage() {
    const { comics, folders } = await getData();
    return <LibraryContent comics={comics} folders={folders} />;
}
