import { PrismaClient } from '@prisma/client';
import https from 'https';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Sample manga page URLs (public domain or testing images)
const SAMPLE_IMAGES = [
    'https://picsum.photos/800/1200?random=1',
    'https://picsum.photos/800/1200?random=2',
    'https://picsum.photos/800/1200?random=3',
    'https://picsum.photos/800/1200?random=4',
    'https://picsum.photos/800/1200?random=5',
];

async function downloadImage(url: string, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                if (response.headers.location) {
                    downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
                    return;
                }
            }

            const fileStream = fs.createWriteStream(filepath);
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('Creating sample pages for Solo Leveling Chapter 1...');

    const comic = await prisma.comic.findFirst({
        where: { title: 'Solo Leveling' },
        include: { chapters: { where: { number: 1 } } }
    });

    if (!comic || comic.chapters.length === 0) {
        console.log('Solo Leveling Chapter 1 not found');
        return;
    }

    const chapter = comic.chapters[0];

    // Create directory
    const chapterDir = path.join(process.cwd(), 'public', 'uploads', 'comics', comic.slug, `chapter-${chapter.number}`);
    fs.mkdirSync(chapterDir, { recursive: true });

    // Delete existing pages
    await prisma.page.deleteMany({ where: { chapterId: chapter.id } });

    // Download sample images
    const pagesData = [];
    for (let i = 0; i < SAMPLE_IMAGES.length; i++) {
        console.log(`  Downloading page ${i + 1}...`);
        const filename = `page-${String(i + 1).padStart(3, '0')}.jpg`;
        const filepath = path.join(chapterDir, filename);

        try {
            await downloadImage(SAMPLE_IMAGES[i], filepath);

            const relativePath = path.relative(path.join(process.cwd(), 'public'), filepath).replace(/\\/g, '/');
            pagesData.push({
                chapterId: chapter.id,
                orderIndex: i + 1,
                imageUrl: `/${relativePath}`,
                width: 800,
                height: 1200,
            });
        } catch (e) {
            console.error(`  Failed to download page ${i + 1}:`, e);
        }
    }

    // Create pages in database
    if (pagesData.length > 0) {
        await prisma.page.createMany({ data: pagesData });
        console.log(`✓ Created ${pagesData.length} sample pages for Chapter 1`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
