
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'https://comick-source-api.notaspider.dev/api';

async function searchComick(query) {
    try {
        const res = await fetch(`${BASE_URL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, source: 'mangapark' })
        });

        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
    } catch (error) {
        console.error('Search failed:', error);
        return [];
    }
}

async function main() {
    console.log('Seeding database from API...');

    const titles = [
        'Bleach', 'One Piece', 'Naruto', 'Dragon Ball',
        'Attack on Titan', 'Demon Slayer', 'My Hero Academia',
        'Jujutsu Kaisen', 'Chainsaw Man', 'Solo Leveling',
        'Berserk', 'Fullmetal Alchemist', 'Hunter x Hunter',
        'Tokyo Ghoul', 'Death Note'
    ];

    for (const title of titles) {
        console.log(`Fetching ${title}...`);
        const results = await searchComick(title);

        if (results.length > 0) {
            const comic = results[0]; // Take the first result

            // Map to our schema
            const slug = comic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

            try {
                await prisma.comic.upsert({
                    where: { slug },
                    update: {
                        coverImageUrl: comic.coverImage,
                        title: comic.title,
                        views: Math.floor(Math.random() * 100000),
                        rating: parseFloat((Math.random() * 2 + 8).toFixed(1))
                    },
                    create: {
                        title: comic.title,
                        slug,
                        description: `Read ${comic.title} on OmniRead.`,
                        origin: 'JP',
                        type: 'Manga',
                        status: 'ONGOING',
                        coverImageUrl: comic.coverImage,
                        contentRating: 'SAFE',
                        views: Math.floor(Math.random() * 100000),
                        rating: parseFloat((Math.random() * 2 + 8).toFixed(1))
                    }
                });
                console.log(`Saved ${comic.title}`);
            } catch (e) {
                console.error(`Failed to save ${title}:`, e.message);
            }
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
