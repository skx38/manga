import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const chapters = await prisma.chapter.findMany({
        where: {
            magnet: { not: null },
            comic: { title: 'Solo Leveling' }
        },
        include: { comic: true },
        take: 5
    });

    console.log(`\nSample Solo Leveling magnets:`);
    for (const chapter of chapters) {
        console.log(`\nChapter ${chapter.number}:`);
        console.log(`Magnet: ${chapter.magnet?.substring(0, 100)}...`);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
