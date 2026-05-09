const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCover() {
    const comic = await prisma.comic.findFirst({
        where: { title: 'Solo Leveling' },
        select: { coverImageUrl: true }
    });
    console.log('URL:', comic.coverImageUrl);
}

checkCover()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
