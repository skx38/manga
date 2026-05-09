import { PrismaClient } from '@prisma/client';
import WebTorrent from 'webtorrent';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const client: any = new WebTorrent();

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'comics');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function processChapter(chapter: any, comicSlug: string) {
    return new Promise<void>((resolve, reject) => {
        if (!chapter.magnet) {
            console.log(`Skipping Chapter ${chapter.number}: No magnet link.`);
            resolve();
            return;
        }

        console.log(`Starting download for ${comicSlug} - Chapter ${chapter.number}...`);

        const downloadPath = path.join(UPLOAD_DIR, comicSlug, `chapter-${chapter.number}`);

        client.add(chapter.magnet, { path: downloadPath }, (torrent: any) => {
            console.log(`  Torrent metadata fetched: ${torrent.name}`);
            console.log(`  Total files: ${torrent.files.length}`);

            // Deselect all first
            torrent.deselect(0, torrent.pieces.length - 1, false);

            // Find image files
            const imageFiles = torrent.files.filter((file: any) => /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name));

            // Sort by name to get order right (usually)
            imageFiles.sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

            const selectedFiles = imageFiles; // Select ALL images

            if (selectedFiles.length === 0) {
                console.log("  No images found in torrent.");
                torrent.destroy();
                resolve();
                return;
            }

            console.log(`  Selecting ${selectedFiles.length} images to download...`);
            selectedFiles.forEach((file: any) => file.select());

            // Monitor progress
            const interval = setInterval(() => {
                const progress = torrent.progress;
                // console.log(`  Progress: ${(progress * 100).toFixed(1)}%`);

                // Check if selected files are done
                const allDone = selectedFiles.every((file: any) => file.progress === 1);
                if (allDone) {
                    clearInterval(interval);
                    console.log(`  Selected files downloaded.`);
                    finishProcessing(selectedFiles);
                }
            }, 1000);

            function finishProcessing(filesToIngest: any[]) {
                // Create Page entries
                const pagesData = filesToIngest.map((file, index) => {
                    const fullPath = path.join(downloadPath, file.path);
                    const relativePath = path.relative(path.join(process.cwd(), 'public'), fullPath).replace(/\\/g, '/');

                    return {
                        chapterId: chapter.id,
                        orderIndex: index + 1,
                        imageUrl: `/${relativePath}`,
                        width: 800,
                        height: 1200,
                    };
                });

                prisma.$transaction([
                    prisma.page.deleteMany({ where: { chapterId: chapter.id } }),
                    prisma.page.createMany({ data: pagesData })
                ]).then(() => {
                    console.log(`  ✓ Database updated with ${pagesData.length} pages.`);
                    torrent.destroy();
                    resolve();
                }).catch(e => {
                    console.error(`  Error updating DB:`, e);
                    torrent.destroy();
                    resolve();
                });
            }

            torrent.on('error', (err: any) => {
                console.error(`  Torrent error:`, err);
                clearInterval(interval);
                torrent.destroy();
                resolve();
            });
        });
    });
}

async function main() {
    // Fetch all comics that have chapters with magnet links
    const comics = await prisma.comic.findMany({
        include: {
            chapters: {
                where: {
                    magnet: { not: null }
                },
                orderBy: { number: 'asc' },
            }
        }
    });

    console.log(`Found ${comics.length} comics to check for ingestion.`);

    for (const comic of comics) {
        if (comic.chapters.length === 0) {
            console.log(`No chapters with magnet links found for ${comic.title}.`);
            continue;
        }

        console.log(`Found ${comic.chapters.length} chapters to ingest for ${comic.title}.`);

        for (const chapter of comic.chapters) {
            await processChapter(chapter, comic.slug);
        }
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
