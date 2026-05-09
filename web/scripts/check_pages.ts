import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const comic = await prisma.comic.findFirst({
        where: { title: 'Solo Leveling' },
        include: {
            chapters: {
                where: { number: 1 },
                include: { pages: true }
            }
        }
    });

    if (!comic || comic.chapters.length === 0) {
        console.log("Chapter 1 not found.");
        return;
    }

    const chapter = comic.chapters[0];
    console.log(`Chapter 1 has ${chapter.pages.length} pages.`);
    chapter.pages.forEach(p => console.log(` - ${p.imageUrl}`));
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
