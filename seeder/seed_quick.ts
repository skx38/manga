import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userId = 'demo_user_id';
    console.log(`Seeding quick stats for user: ${userId}`);

    // 1. Ensure User Exists
    await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            username: 'DemoUser',
            email: 'demo@example.com',
        }
    });

    // 2. Get chapters
    const chapters = await prisma.chapter.findMany({
        take: 10,
        include: { comic: true }
    });

    if (chapters.length === 0) {
        console.log('No chapters found.');
        return;
    }

    // 3. Create Stats for Today (5 chapters) and Yesterday (3 chapters)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today
    await prisma.userReadingStat.upsert({
        where: { userId_date: { userId, date: today } },
        update: { chaptersRead: 5 },
        create: { userId, date: today, chaptersRead: 5 }
    });

    // Yesterday
    await prisma.userReadingStat.upsert({
        where: { userId_date: { userId, date: yesterday } },
        update: { chaptersRead: 3 },
        create: { userId, date: yesterday, chaptersRead: 3 }
    });

    console.log('Created stats for Today (5) and Yesterday (3).');

    // 4. Create Reading Progress for these chapters
    // Just to make sure they show up in "Recent Activity"
    for (let i = 0; i < 5; i++) {
        const chapter = chapters[i];
        if (!chapter) break;

        await prisma.readingProgress.upsert({
            where: { userId_chapterId: { userId, chapterId: chapter.id } },
            update: {
                lastRead: new Date(),
                scrollPercentage: 1.0
            },
            create: {
                userId,
                chapterId: chapter.id,
                pageNumber: 1,
                scrollPercentage: 1.0,
                lastRead: new Date()
            }
        });

        // Ensure Library Entry
        await prisma.libraryEntry.upsert({
            where: { userId_comicId: { userId, comicId: chapter.comicId } },
            update: { status: 'READING' },
            create: { userId, comicId: chapter.comicId, status: 'READING' }
        });
    }

    console.log('Quick stats seeded!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
