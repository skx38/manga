import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const comics = await (prisma.comic as any).findMany({
        take: 6,
        orderBy: {
            createdAt: 'desc',
        },
    });

    console.log('Trending Comics Raw:', JSON.stringify(comics.slice(0, 1).map((c: any) => ({ id: c.id, title: c.title, coverImageUrl: c.coverImageUrl })), null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
