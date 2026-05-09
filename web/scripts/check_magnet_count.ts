import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const comics = await prisma.comic.findMany({
        include: {
            chapters: {
                where: { magnet: { not: null } }
            }
        }
    });

    console.log(`\nComics with magnet links:`);
    for (const comic of comics) {
        if (comic.chapters.length > 0) {
            console.log(`${comic.title}: ${comic.chapters.length} chapters`);
        }
    }

    const totalChapters = await prisma.chapter.count({
        where: { magnet: { not: null } }
    });
    console.log(`\nTotal chapters with magnets: ${totalChapters}`);

    const totalPages = await prisma.page.count();
    console.log(`Total pages in database: ${totalPages}`);
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
