import { PrismaClient } from '@prisma/client';
import ComicCard from '@/components/ComicCard';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getData(shareId: string) {
    const folder = await prisma.folder.findUnique({
        where: { shareId },
        include: {
            comics: {
                include: {
                    comic: true
                }
            },
            user: {
                select: {
                    username: true
                }
            }
        }
    });

    if (!folder || !folder.isPublic) {
        return null;
    }

    return folder;
}

export default async function SharedFolderPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = await params;
    const folder = await getData(shareId);

    if (!folder) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 border-b border-gray-800 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white">{folder.name}</h1>
                        <span className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            Shared Folder
                        </span>
                    </div>
                    <p className="text-gray-400">
                        Curated by <span className="text-white font-medium">{folder.user.username || 'Unknown User'}</span>
                        <span className="mx-2">•</span>
                        {folder.comics.length} items
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {folder.comics.map((fc) => (
                        <ComicCard
                            key={fc.comic.id}
                            id={fc.comic.id}
                            title={fc.comic.title}
                            coverUrl={fc.comic.coverImageUrl || '/placeholder-cover.png'}
                            type={fc.comic.type}
                            rating={8.5}
                            // Shared view is read-only regarding library status
                            currentStatus={null}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
