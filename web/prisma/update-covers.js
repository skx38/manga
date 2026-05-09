const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Using more reliable image sources (Imgur, direct CDN links)
const DEFAULT_COVERS = {
    'jujutsu-kaisen': 'https://i.imgur.com/6J9fF3g.jpg',
    'chainsaw-man': 'https://i.imgur.com/lbHJKqr.jpg',
    'solo-leveling': 'https://i.imgur.com/93gYzCj.png',
    'one-piece': 'https://i.imgur.com/qQwqp8z.jpg',
    'tower-of-god': 'https://i.imgur.com/oQZqFpg.jpg',
    'omniscient-readers-viewpoint': 'https://i.imgur.com/y9rXKPm.jpg',
    'omniscient-reader': 'https://i.imgur.com/y9rXKPm.jpg',
    'the-beginning-after-the-end': 'https://i.imgur.com/Z5qQ0sO.jpg',
    'spy-x-family': 'https://i.imgur.com/8BdVhsm.jpg',
    'demon-slayer-kimetsu-no-yaiba': 'https://i.imgur.com/wL8vLwD.jpg',
    'black-clover': 'https://i.imgur.com/vQGmqON.jpg',
};

async function updateCovers() {
    console.log('🖼️  Updating cover images with reliable URLs...\n');

    const comics = await prisma.comic.findMany();
    let updated = 0;

    for (const comic of comics) {
        const newCover = DEFAULT_COVERS[comic.slug];

        if (newCover) {
            await prisma.comic.update({
                where: { id: comic.id },
                data: { coverImageUrl: newCover },
            });
            console.log(`✓ Updated: ${comic.title} -> ${newCover.substring(0, 30)}...`);
            updated++;
        } else {
            console.log(`⚠️  No cover found for: ${comic.title} (${comic.slug})`);
        }
    }

    console.log(`\n✅ Updated ${updated} covers`);
}

updateCovers()
    .catch((e) => {
        console.error('❌ Update failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
