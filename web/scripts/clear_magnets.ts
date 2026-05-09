import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Clearing all magnet links from database...");
    await prisma.chapter.updateMany({
        data: { magnet: null }
    });
    console.log("✓ Magnets cleared.");
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
