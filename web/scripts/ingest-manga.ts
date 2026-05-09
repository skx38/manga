import { MangaDexClient } from './clients/mangadex';
import { ComickClient } from './clients/comick';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface IngestOptions {
    mangaId: string;      // Your DB manga ID
    externalId: string;   // MangaDex or Comick ID
    source: 'mangadex' | 'comick';
    chapters?: number[];  // Specific chapters, or all if empty
}

export async function ingestMangaChapters(options: IngestOptions) {
    const { mangaId, externalId, source, chapters } = options;

    console.log(`Starting ingestion from ${source} for manga ${mangaId}...`);

    // 1. Get chapter list from source
    const chapterList = source === 'mangadex'
        ? await MangaDexClient.getChapters(externalId)
        : await ComickClient.getChapters(externalId);

    console.log(`Found ${chapterList.length} chapters available`);

    // 2. Filter to requested chapters
    const toDownload = chapters?.length
        ? chapterList.filter(ch => chapters.includes(ch.number))
        : chapterList;

    console.log(`Will download ${toDownload.length} chapters`);

    // 3. Download each chapter
    for (const chapter of toDownload) {
        try {
            console.log(`\nProcessing Chapter ${chapter.number}...`);

            // Get image URLs
            const imageUrls = source === 'mangadex'
                ? await MangaDexClient.getChapterImages(chapter.id)
                : await ComickClient.getChapterImages(chapter.id);

            console.log(`  Found ${imageUrls.length} pages`);

            // Create directory
            const manga = await prisma.comic.findUnique({ where: { id: mangaId } });
            if (!manga) {
                throw new Error(`Manga ${mangaId} not found in database`);
            }

            const chapterDir = path.join(
                process.cwd(),
                'public/uploads/comics',
                manga.slug,
                `chapter-${chapter.number}`
            );
            await fs.mkdir(chapterDir, { recursive: true });

            // Download images
            const pages = [];
            for (const [index, url] of imageUrls.entries()) {
                try {
                    console.log(`  Downloading page ${index + 1}/${imageUrls.length}...`);

                    const response = await fetch(url);
                    if (!response.ok) {
                        console.error(`  Failed to download page ${index + 1}: ${response.statusText}`);
                        continue;
                    }

                    const buffer = Buffer.from(await response.arrayBuffer());
                    const filename = `page-${String(index + 1).padStart(3, '0')}.jpg`;
                    const filepath = path.join(chapterDir, filename);

                    await fs.writeFile(filepath, buffer);
                    pages.push({
                        orderIndex: index + 1,
                        imageUrl: `/uploads/comics/${manga.slug}/chapter-${chapter.number}/${filename}`,
                        width: 800,  // Default, could extract from image if needed
                        height: 1200,
                    });

                    // Rate limiting - be respectful to APIs
                    await new Promise(r => setTimeout(r, 500));

                } catch (error) {
                    console.error(`  Error downloading page ${index + 1}:`, error);
                    // Continue with next page
                }
            }

            if (pages.length === 0) {
                console.error(`  No pages downloaded for chapter ${chapter.number}`);
                continue;
            }

            // 4. Update database
            const slug = `chapter-${chapter.number}`;
            await prisma.chapter.upsert({
                where: {
                    comicId_slug: { comicId: mangaId, slug }
                },
                create: {
                    comicId: mangaId,
                    number: chapter.number,
                    title: chapter.title,
                    slug,
                    releaseDate: new Date(chapter.publishAt),
                    pages: { create: pages },
                },
                update: {
                    title: chapter.title,
                    pages: {
                        deleteMany: {},
                        create: pages
                    },
                },
            });

            console.log(`✅ Chapter ${chapter.number} ingested successfully (${pages.length} pages)`);

        } catch (error) {
            console.error(`❌ Failed to ingest chapter ${chapter.number}:`, error);
            // Continue with next chapter
        }
    }

    console.log(`\nIngestion complete!`);
}

// Example usage
async function main() {
    // Example: Ingest Solo Leveling from Comick
    await ingestMangaChapters({
        mangaId: 'YOUR_MANGA_ID_HERE', // Get from your database
        externalId: 'solo-leveling',    // Comick slug
        source: 'comick',
        chapters: [1, 2, 3], // Or omit to download all
    });
}

// Uncomment to run
// main()
//   .catch(console.error)
//   .finally(() => prisma.$disconnect());
