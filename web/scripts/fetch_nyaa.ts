import { PrismaClient } from '@prisma/client';
import { si } from 'nyaapi';

const prisma = new PrismaClient();

// Regex from Python script:
// ^(?:\[(.*?)\])?\s*(.*?)\s+(?:-\s+)?(?:c|ch\.?|chapter|#)?\s*(\d+(\.\d+)?).*
const FILENAME_REGEX = /^(?:\[(.*?)\])?\s*(.*?)\s+(?:-\s+)?(?:c|ch\.?|chapter|#)?\s*(\d+(\.\d+)?).*/i;

async function searchNyaa(term: string) {
    try {
        // Remove filters to get more results, we will filter manually
        const results = await si.search({
            term,
            // category: '3_1', // Literature - English Translated
            // filter: 2, // Trusted only
        });
        return results;
    } catch (e) {
        console.error(`Error searching Nyaa for ${term}:`, e);
        return [];
    }
}

function parseFilename(filename: string) {
    const match = filename.match(FILENAME_REGEX);
    if (!match) return null;

    return {
        scanGroup: match[1] || 'Unknown',
        title: match[2].trim(),
        chapter: parseFloat(match[3]),
    };
}

function isVideo(filename: string) {
    const lower = filename.toLowerCase();
    return lower.includes('.mkv') ||
        lower.includes('.mp4') ||
        lower.includes('.avi') ||
        lower.includes('1080p') ||
        lower.includes('720p') ||
        lower.includes('hevc') ||
        lower.includes('bdmv');
}

async function main() {
    console.log('Fetching comics from database...');
    const comics = await prisma.comic.findMany({
        // Process all comics
        include: {
            chapters: true,
        },
    });

    console.log(`Found ${comics.length} comics.`);

    for (const comic of comics) {
        console.log(`Processing ${comic.title}...`);

        // Search Nyaa
        const results = await searchNyaa(comic.title);
        console.log(`  Found ${results.length} results on Nyaa.`);

        let updatedCount = 0;

        for (const result of results) {
            if (isVideo(result.name)) {
                // console.log(`    Skipping video: ${result.name}`);
                continue;
            }

            const parsed = parseFilename(result.name);
            if (!parsed) {
                // console.log(`    Failed to parse: ${result.name}`);
                continue;
            }

            // Simple title check
            if (!result.name.toLowerCase().includes(comic.title.toLowerCase())) {
                continue;
            }

            // Find matching chapter in DB
            const dbChapter = comic.chapters.find(c => c.number === parsed.chapter);

            if (dbChapter) {
                // Only update if not already set (or overwrite if we want to fix bad links)
                // Let's overwrite for now since we had bad links
                console.log(`    MATCH! Chapter ${parsed.chapter} found in DB.`);
                console.log(`    Updating with magnet: ${result.magnet?.substring(0, 20)}...`);

                try {
                    await prisma.chapter.update({
                        where: { id: dbChapter.id },
                        data: {
                            magnet: result.magnet,
                        },
                    });
                    updatedCount++;
                } catch (e) {
                    console.error(`    Error updating DB:`, e);
                }
            }
        }

        if (updatedCount > 0) {
            console.log(`  ✓ Updated ${updatedCount} chapters with magnet links.`);
        } else {
            console.log(`  No matching chapters found to update.`);
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 2000));
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
