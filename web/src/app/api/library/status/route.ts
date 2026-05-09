import { NextResponse } from 'next/server';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { comicId, status, details } = await request.json();
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        console.log(`[API] Updating library status: userId=${userId}, comicId=${comicId}, status=${status}`);

        let result;
        let targetComicId = comicId;

        // Check if comic exists locally (by ID or Slug)
        let comic = await (prisma as any).comic.findFirst({
            where: {
                OR: [
                    { id: comicId },
                    { slug: comicId }
                ]
            }
        });

        // If not found and we have details, create it
        if (!comic && details) {
            console.log(`[API] Comic not found locally. Creating from details:`, details);
            try {
                comic = await (prisma as any).comic.create({
                    data: {
                        title: details.title,
                        slug: comicId, // Use Comick ID as slug
                        coverImageUrl: details.coverUrl,
                        type: details.type || 'Manga',
                        origin: 'JP', // Default to JP for now
                        description: 'Imported from Comick',
                    }
                });
                console.log(`[API] Created local comic: ${comic.id}`);
            } catch (createError) {
                console.error('Failed to create comic:', createError);
                return NextResponse.json({ error: 'Failed to create comic record' }, { status: 500 });
            }
        }

        if (comic) {
            targetComicId = comic.id;
        } else if (status !== null) {
            // If we're trying to add/update but don't have a comic and no details provided
            return NextResponse.json({ error: 'Comic not found and no details provided' }, { status: 404 });
        }

        if (status === null) {
            // Unfollow: Delete the entry
            try {
                result = await (prisma as any).libraryEntry.delete({
                    where: {
                        userId_comicId: {
                            userId,
                            comicId: targetComicId,
                        },
                    },
                });
                console.log(`[API] Deleted library entry for comic ${targetComicId}`);

                // Also remove from all folders
                await (prisma as any).folderComic.deleteMany({
                    where: {
                        comicId: targetComicId,
                        folder: { userId }
                    }
                });
                console.log(`[API] Removed comic ${targetComicId} from all folders`);
            } catch (e) {
                // Ignore if record doesn't exist
                console.log(`[API] No entry found to delete for comic ${targetComicId}`);
                result = null;
            }
        } else {
            // Upsert: Update or Create
            result = await (prisma as any).libraryEntry.upsert({
                where: {
                    userId_comicId: {
                        userId,
                        comicId: targetComicId,
                    },
                },
                update: {
                    status,
                },
                create: {
                    userId,
                    comicId: targetComicId,
                    status,
                },
            });
            console.log(`[API] Upserted library entry:`, result);
        }

        // Revalidate the comic page and library page to reflect changes immediately
        revalidatePath(`/comic/${comicId}`);
        revalidatePath('/library');
        revalidatePath('/'); // For Up Next queue
        revalidatePath('/search');
        console.log(`[API] Revalidated paths for comic ${comicId}`);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating library status:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
