import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { comicId, details } = await request.json();
        const params = await context.params;
        const folderId = params.id;

        // Ensure comic exists locally
        let comic = await prisma.comic.findUnique({ where: { id: comicId } });
        if (!comic && details) {
            try {
                comic = await prisma.comic.create({
                    data: {
                        id: comicId,
                        title: details.title,
                        slug: comicId, // Use ID as slug for now if not provided
                        coverImageUrl: details.coverUrl,
                        type: details.type || 'Manga',
                        origin: 'JP', // Default
                        description: 'Imported via Folder Add',
                    }
                });
            } catch (e) {
                // If create fails (race condition), try finding again
                comic = await prisma.comic.findUnique({ where: { id: comicId } });
            }
        }

        if (!comic) {
            return NextResponse.json({ error: 'Comic not found and no details provided' }, { status: 404 });
        }

        // Use upsert to handle potential duplicates (idempotency)
        const item = await prisma.folderComic.upsert({
            where: {
                folderId_comicId: {
                    folderId,
                    comicId
                }
            },
            update: {}, // No-op if exists
            create: {
                folderId,
                comicId
            }
        });

        revalidatePath('/library');
        return NextResponse.json(item);
    } catch (error) {
        console.error('[API] Failed to add comic to folder:', error);
        return NextResponse.json({ error: 'Failed to add comic to folder', details: String(error) }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { comicId } = await request.json();
        const params = await context.params;
        const folderId = params.id;

        await prisma.folderComic.delete({
            where: {
                folderId_comicId: {
                    folderId,
                    comicId
                }
            }
        });

        revalidatePath('/library');
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to remove comic from folder' }, { status: 500 });
    }
}
