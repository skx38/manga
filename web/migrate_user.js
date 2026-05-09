const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateUser() {
    const oldUserId = 'user-1';
    const newUserId = 'demo_user_id';

    console.log(`Migrating data from ${oldUserId} to ${newUserId}...`);

    // 1. Migrate Library Entries
    const libraryEntries = await prisma.libraryEntry.findMany({ where: { userId: oldUserId } });
    console.log(`Found ${libraryEntries.length} library entries.`);

    for (const entry of libraryEntries) {
        try {
            await prisma.libraryEntry.upsert({
                where: { userId_comicId: { userId: newUserId, comicId: entry.comicId } },
                update: { status: entry.status, score: entry.score },
                create: { ...entry, userId: newUserId }
            });
            // Delete old entry
            await prisma.libraryEntry.delete({ where: { userId_comicId: { userId: oldUserId, comicId: entry.comicId } } });
        } catch (e) {
            console.error(`Failed to migrate library entry for comic ${entry.comicId}:`, e.message);
        }
    }

    // 2. Migrate Reading Progress
    const progress = await prisma.readingProgress.findMany({ where: { userId: oldUserId } });
    console.log(`Found ${progress.length} reading progress records.`);

    for (const p of progress) {
        try {
            await prisma.readingProgress.upsert({
                where: { userId_chapterId: { userId: newUserId, chapterId: p.chapterId } },
                update: { scrollPercentage: p.scrollPercentage, lastRead: p.lastRead },
                create: { ...p, userId: newUserId, id: undefined } // id is auto-generated usually, but here it's composite key or uuid? Schema says id is String @id @default(uuid())
            });
            await prisma.readingProgress.delete({ where: { id: p.id } });
        } catch (e) {
            console.error(`Failed to migrate progress for chapter ${p.chapterId}:`, e.message);
        }
    }

    // 3. Migrate Folders
    const folders = await prisma.folder.findMany({ where: { userId: oldUserId } });
    console.log(`Found ${folders.length} folders.`);

    for (const f of folders) {
        try {
            // Update folder owner
            await prisma.folder.update({
                where: { id: f.id },
                data: { userId: newUserId }
            });
        } catch (e) {
            console.error(`Failed to migrate folder ${f.name}:`, e.message);
        }
    }

    // 4. Migrate Comments
    const comments = await prisma.comment.findMany({ where: { userId: oldUserId } });
    console.log(`Found ${comments.length} comments.`);
    // Update many is easier here
    await prisma.comment.updateMany({
        where: { userId: oldUserId },
        data: { userId: newUserId }
    });

    // 5. Migrate Votes
    const votes = await prisma.vote.findMany({ where: { userId: oldUserId } });
    console.log(`Found ${votes.length} votes.`);
    // Update many
    await prisma.vote.updateMany({
        where: { userId: oldUserId },
        data: { userId: newUserId }
    });

    console.log('Migration complete!');
}

migrateUser()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
