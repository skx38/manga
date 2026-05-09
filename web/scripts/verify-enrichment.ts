import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tags = await prisma.tag.count();
    const comicTags = await prisma.comicTag.count();
    const comicsWithYear = await prisma.comic.count({
        where: { publishedYear: { not: null } }
    });

    console.log(`Tags: ${tags}`);
    console.log(`ComicTags: ${comicTags}`);
    console.log(`Comics with Year: ${comicsWithYear}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
