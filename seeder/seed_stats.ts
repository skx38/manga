import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userId = 'demo_user_id';
    console.log(`Seeding stats for user: ${userId}`);

    // 1. Ensure User Exists
    const user = await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            username: 'DemoUser',
            email: 'demo@example.com',
        }
    });

    // 2. Get some chapters to "read"
    const chapters = await prisma.chapter.findMany({
        take: 50,
        include: { comic: true }
    });

    if (chapters.length === 0) {
        console.log('No chapters found. Please run the main seed script first.');
        return;
    }

    console.log(`Found ${chapters.length} chapters to distribute.`);

    // 3. Generate Reading Stats (Heatmap & Streaks)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const statsToCreate: any[] = [];

    // Last 60 days
    for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        let shouldRead = false;
        let count = 0;

        if (i < 15) {
            shouldRead = Math.random() > 0.1; // 90% chance
        } else if (i < 30) {
            shouldRead = Math.random() > 0.5; // 50% chance
        } else {
            shouldRead = Math.random() > 0.7; // 30% chance
        }

        if (shouldRead) {
            count = Math.floor(Math.random() * 5) + 1; // 1-5 chapters
            statsToCreate.push({
                userId,
                date,
                chaptersRead: count
            });
        }
    }

    console.log(`Creating ${statsToCreate.length} daily stat entries...`);

    for (const stat of statsToCreate) {
        await prisma.userReadingStat.upsert({
            where: {
                userId_date: {
                    userId: stat.userId,
                    date: stat.date
                }
            },
            update: { chaptersRead: stat.chaptersRead },
            create: stat
        });
    }

    // 4. Generate Recent Reading Progress (Activity Feed)
    let chapterIndex = 0;
    statsToCreate.sort((a, b) => b.date.getTime() - a.date.getTime());

    console.log('Updating reading progress for recent activity...');

    for (const stat of statsToCreate.slice(0, 10)) { // Only do the last 10 days of activity
        const chaptersForDay = stat.chaptersRead;

        for (let j = 0; j < chaptersForDay; j++) {
            if (chapterIndex >= chapters.length) break;

            const chapter = chapters[chapterIndex];
            chapterIndex++;

            const lastRead = new Date(stat.date);
            lastRead.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            await prisma.readingProgress.upsert({
                where: {
                    userId_chapterId: {
                        userId,
                        chapterId: chapter.id
                    }
                },
                update: {
                    lastRead,
                    pageNumber: 10,
                    scrollPercentage: 1.0
                },
                create: {
                    userId,
                    chapterId: chapter.id,
                    pageNumber: 10,
                    scrollPercentage: 1.0,
                    lastRead
                }
            });

            await prisma.libraryEntry.upsert({
                where: {
                    userId_comicId: {
                        userId,
                        comicId: chapter.comicId
                    }
                },
                update: { status: 'READING' },
                create: {
                    userId,
                    comicId: chapter.comicId,
                    status: 'READING'
                }
            });
        }
    }

    console.log('Stats seeding completed!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
