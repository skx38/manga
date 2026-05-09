import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const comic = await prisma.comic.findFirst({
        where: { title: 'Solo Leveling' },
        include: { chapters: true }
    });

    if (!comic) {
        console.log("Comic 'Solo Leveling' not found.");
        return;
    }

    console.log(`Comic: ${comic.title}`);
    console.log(`Total Chapters: ${comic.chapters.length}`);

    const withMagnet = comic.chapters.filter(c => c.magnet);
    console.log(`Chapters with magnet: ${withMagnet.length}`);

    if (withMagnet.length > 0) {
        console.log("Sample magnet:", withMagnet[0].magnet);
        console.log("Sample chapter number:", withMagnet[0].number);
    } else {
        console.log("No chapters have magnet links.");
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
