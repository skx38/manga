const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyHomeFeed() {
    const userId = 'demo_user_id';
    console.log(`Verifying Home Feed for ${userId}...`);

    // 1. Get a comic from the user's library
    const libraryEntry = await prisma.libraryEntry.findFirst({
        where: { userId },
        include: { comic: true }
    });

    if (!libraryEntry) {
        console.error('No library entries found for user. Cannot verify Home feed.');
        // Try to create one
        const comic = await prisma.comic.findFirst();
        if (comic) {
            console.log(`Adding comic ${comic.title} to library...`);
            await prisma.libraryEntry.create({
                data: {
                    userId,
                    comicId: comic.id,
                    status: 'READING',
                    score: 0
                }
            });
            console.log('Added.');
        } else {
            console.error('No comics found in DB.');
            return;
        }
    } else {
        console.log(`Found library entry for comic: ${libraryEntry.comic.title} (${libraryEntry.comicId})`);
    }

    const comicId = libraryEntry ? libraryEntry.comicId : (await prisma.comic.findFirst()).id;

    // 2. Create a post for this comic
    console.log('Creating a test post...');
    const post = await prisma.post.create({
        data: {
            title: 'Test Post for Home Feed ' + Date.now(),
            content: 'This should appear in the home feed.',
            userId,
            comicId,
            flair: 'DISCUSSION'
        }
    });
    console.log(`Created post: ${post.id}`);

    // 3. Fetch Home Feed via API logic (simulated)
    // The API logic is:
    // const libraryEntries = await prisma.libraryEntry.findMany({ where: { userId }, select: { comicId: true } });
    // const comicIds = libraryEntries.map(e => e.comicId);
    // const posts = await prisma.post.findMany({ where: { comicId: { in: comicIds } } });

    const fetchedLibraryEntries = await prisma.libraryEntry.findMany({
        where: { userId },
        select: { comicId: true }
    });
    const comicIds = fetchedLibraryEntries.map(e => e.comicId).filter(id => id);
    console.log(`User is following ${comicIds.length} comics:`, comicIds);

    if (comicIds.length === 0) {
        console.log('User follows no comics. Home feed will be empty.');
        return;
    }

    try {
        const homePosts = await prisma.post.findMany({
            where: {
                comicId: { in: comicIds }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log(`Found ${homePosts.length} posts in Home Feed.`);
        const found = homePosts.find(p => p.id === post.id);

        if (found) {
            console.log('SUCCESS: Created post found in Home Feed!');
        } else {
            console.error('FAILURE: Created post NOT found in Home Feed.');
            console.log('Home Posts IDs:', homePosts.map(p => p.id));
        }
    } catch (error) {
        console.error('Error fetching home posts:', error);
    }
}

verifyHomeFeed()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
