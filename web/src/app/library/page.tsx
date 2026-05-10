import { PrismaClient } from '@prisma/client';
import LibraryContent from '@/components/library/LibraryContent';
import { getCurrentUserIdOrDemo } from '@/lib/session';

const prisma = new PrismaClient();

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

async function getData(userId: string) {

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
    const userId = await getCurrentUserIdOrDemo();
    if (!userId) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center px-4">
                <div className="max-w-md">
                    <h1 className="text-2xl font-bold mb-2">Sign in to use your library</h1>
                    <p className="text-muted-foreground mb-6">
                        Track what you&apos;re reading, organize folders, and sync progress across devices.
                    </p>
                    <a
                        href="/api/auth/signin"
                        className="inline-flex h-10 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Sign in
                    </a>
                </div>
            </div>
        );
    }
    const { comics, folders } = await getData(userId);
    return <LibraryContent comics={comics} folders={folders} />;
}
