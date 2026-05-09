
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const userId = 'user-1';
        const comicId = 'test-folder-comic-id';
        const folderName = 'Test Folder Persistence';

        // 1. Create Comic (if not exists)
        let comic = await prisma.comic.findUnique({ where: { slug: comicId } });
        if (!comic) {
            comic = await prisma.comic.create({
                data: {
                    id: comicId,
                    title: 'Test Comic',
                    slug: comicId,
                    type: 'Manga',
                    origin: 'JP'
                }
            });
        }

        // 2. Create Folder
        let folder = await prisma.folder.findFirst({ where: { userId, name: folderName } });
        if (!folder) {
            folder = await prisma.folder.create({
                data: { userId, name: folderName }
            });
        }
        console.log('Folder ID:', folder.id);

        // 3. Add Comic to Folder (Directly via Prisma to simulate API)
        await prisma.folderComic.create({
            data: {
                folderId: folder.id,
                comicId: comic.id
            }
        });
        console.log('Added comic to folder');

        // 4. Verify Persistence
        const check = await prisma.folder.findUnique({
            where: { id: folder.id },
            include: { comics: true }
        });

        const hasComic = check.comics.some(c => c.comicId === comic.id);
        console.log('Persisted?', hasComic);

        // Cleanup
        await prisma.folderComic.deleteMany({ where: { folderId: folder.id } });
        await prisma.folder.delete({ where: { id: folder.id } });
        await prisma.comic.delete({ where: { id: comic.id } });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
