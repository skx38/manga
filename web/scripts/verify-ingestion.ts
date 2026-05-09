import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const comics = await prisma.comic.count();
    const chapters = await prisma.chapter.count();
    console.log(`Comics: ${comics}`);
    console.log(`Chapters: ${chapters}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
