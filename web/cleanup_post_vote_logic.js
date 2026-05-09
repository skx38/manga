
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Cleaning up post vote logic test data...');

        try {
            const deleteComic = await prisma.comic.delete({
                where: { id: 'test-post-vote-logic-comic' }
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
