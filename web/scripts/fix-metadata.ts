import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing comic metadata...');

    // 1. Omniscient Reader's Viewpoint (Korean Manhwa)
    await prisma.comic.updateMany({
        where: { title: { contains: "Omniscient Reader", mode: 'insensitive' } },
        data: {
            origin: 'KR',
            type: 'Manhwa'
        }
    });
    console.log('Fixed Omniscient Reader');

    // 2. Solo Leveling (Korean Manhwa)
    await prisma.comic.updateMany({
        where: { title: { contains: "Solo Leveling", mode: 'insensitive' } },
        data: {
            origin: 'KR',
            type: 'Manhwa'
        }
    });
    console.log('Fixed Solo Leveling');

    // 3. Black Clover (Japanese Manga)
    await prisma.comic.updateMany({
        where: { title: { contains: "Black Clover", mode: 'insensitive' } },
        data: {
            origin: 'JP',
            type: 'Manga'
        }
    });
    console.log('Fixed Black Clover');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
