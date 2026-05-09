
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const userId = 'user-1';
        const folderName = 'Test Shared Folder';

        // 1. Create Folder
        let folder = await prisma.folder.create({
            data: { userId, name: folderName }
        });
        console.log('Created Folder:', folder.id);

        // 2. Share Folder (Simulate API)
        const updatedFolder = await prisma.folder.update({
            where: { id: folder.id },
            data: { isPublic: true }
        });
        console.log('Shared Folder:', updatedFolder.shareId);

        // 3. Verify Access (Simulate Page Data Fetch)
        const publicFolder = await prisma.folder.findUnique({
            where: { shareId: updatedFolder.shareId },
            include: { comics: true }
        });

        if (publicFolder && publicFolder.isPublic) {
            console.log('SUCCESS: Public folder accessible via shareId');
        } else {
            console.error('FAILURE: Public folder not accessible');
        }

        // Cleanup
        await prisma.folder.delete({ where: { id: folder.id } });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
