
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Cleaning up post test data...');

        // Delete the test comic (this should cascade delete the post if configured, or we delete post first)
        // Schema says: Post -> Comic (onDelete: Cascade)
        // So deleting comic should be enough.

        try {
            const deleteComic = await prisma.comic.delete({
                where: { id: 'test-post-comic' }
            });
            console.log('Deleted test comic:', deleteComic.title);
        } catch (e) {
            if (e.code === 'P2025') {
                console.log('Test comic not found (already deleted?)');
            } else {
                console.error('Error deleting comic:', e);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
