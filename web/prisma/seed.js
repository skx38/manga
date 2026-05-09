const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with sample data...');

    // Clean up existing data
    await prisma.page.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.comicTag.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.comic.deleteMany();

    // Create tags
    const tags = await Promise.all([
        prisma.tag.create({ data: { name: 'Fantasy', type: 'Theme' } }),
        prisma.tag.create({ data: { name: 'Action', type: 'Theme' } }),
        prisma.tag.create({ data: { name: 'Romance', type: 'Theme' } }),
        prisma.tag.create({ data: { name: 'Drama', type: 'Theme' } }),
    ]);

    console.log(`✓ Created ${tags.length} tags`);

    // Create Solo Leveling (Korean)
    const soloLeveling = await prisma.comic.create({
        data: {
            title: 'Solo Leveling',
            slug: 'solo-leveling',
            origin: 'KR',
            type: 'Manhwa',
            status: 'COMPLETED',
            description: 'An E-rank Hunter becomes the strongest after obtaining a mysterious power.',
            coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9c/Solo_Leveling_Webtoon_cover.png',
            altTitles: { korean: '나 혼자만 레벨업' },
            tags: {
                create: [
                    { tag: { connect: { id: tags[0].id } } },
                    { tag: { connect: { id: tags[1].id } } },
                ],
            },
        },
    });

    // Create One Piece (Japanese)
    const onePiece = await prisma.comic.create({
        data: {
            title: 'One Piece',
            slug: 'one-piece',
            origin: 'JP',
            type: 'Manga',
            status: 'ONGOING',
            description: 'The adventures of Monkey D. Luffy and his pirate crew in search of the ultimate treasure.',
            coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg',
            altTitles: { japanese: 'ワンピース' },
            tags: {
                create: [
                    { tag: { connect: { id: tags[1].id } } },
                    { tag: { connect: { id: tags[3].id } } },
                ],
            },
        },
    });

    // Create Tower of God (Korean)
    const towerOfGod = await prisma.comic.create({
        data: {
            title: 'Tower of God',
            slug: 'tower-of-god',
            origin: 'KR',
            type: 'Webtoon',
            status: 'ONGOING',
            description: 'What do you desire? Money and wealth? Honor and pride? Whatever you desire is here.',
            coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/5/59/Tower_of_God_Volume_1_Cover.jpg',
            altTitles: { korean: '신의 탑' },
            tags: {
                create: [
                    { tag: { connect: { id: tags[0].id } } },
                    { tag: { connect: { id: tags[1].id } } },
                ],
            },
        },
    });

    console.log(`✓ Created 3 comics`);

    // Create chapters for Solo Leveling
    for (let i = 1; i <= 3; i++) {
        const chapter = await prisma.chapter.create({
            data: {
                comicId: soloLeveling.id,
                number: i,
                title: `Chapter ${i}`,
                slug: `chapter-${i}`,
                releaseDate: new Date(2023, 0, i),
                pageMode: 'STRIP',
            },
        });

        // Create pages
        const pages = [];
        for (let j = 1; j <= 20; j++) {
            pages.push({
                chapterId: chapter.id,
                orderIndex: j,
                imageUrl: `https://picsum.photos/800/1200?random=${i * 100 + j}`,
                width: 800,
                height: 1200,
            });
        }
        await prisma.page.createMany({ data: pages });
    }

    // Create chapters for One Piece
    for (let i = 1; i <= 3; i++) {
        const chapter = await prisma.chapter.create({
            data: {
                comicId: onePiece.id,
                number: i,
                title: `Chapter ${i}: Romance Dawn`,
                slug: `chapter-${i}`,
                releaseDate: new Date(2023, 0, i),
                pageMode: 'PAGE',
            },
        });

        const pages = [];
        for (let j = 1; j <= 18; j++) {
            pages.push({
                chapterId: chapter.id,
                orderIndex: j,
                imageUrl: `https://picsum.photos/800/1200?random=${1000 + i * 100 + j}`,
                width: 800,
                height: 1200,
            });
        }
        await prisma.page.createMany({ data: pages });
    }

    // Create chapters for Tower of God
    for (let i = 1; i <= 3; i++) {
        const chapter = await prisma.chapter.create({
            data: {
                comicId: towerOfGod.id,
                number: i,
                title: `Season 1 - Chapter ${i}`,
                slug: `s1-chapter-${i}`,
                releaseDate: new Date(2023, 0, i),
                pageMode: 'STRIP',
            },
        });

        const pages = [];
        for (let j = 1; j <= 25; j++) {
            pages.push({
                chapterId: chapter.id,
                orderIndex: j,
                imageUrl: `https://picsum.photos/800/1200?random=${2000 + i * 100 + j}`,
                width: 800,
                height: 1200,
            });
        }
        await prisma.page.createMany({ data: pages });
    }

    console.log(`✓ Created chapters and pages`);
    console.log('✅ Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
