import { PrismaClient } from '@prisma/client';
import { si } from 'nyaapi';

const prisma = new PrismaClient();

async function main() {
    const query = "Solo Leveling";
    console.log(`Searching Nyaa for: ${query}`);

    try {
        const results = await si.search({
            term: query,
        });

        console.log(`Found ${results.length} total results.`);

        const mangaResults = results.filter((r: any) => {
            const name = r.name.toLowerCase();
            const isVideo = name.includes('mkv') || name.includes('mp4') || name.includes('1080p') || name.includes('720p') || name.includes('bdmv') || name.includes('hevc');
            // Strict manga check: must have cbz or specific chapter notation
            const isManga = name.includes('cbz') || name.includes('chapter') || (name.includes('vol') && !name.includes('bd'));
            return isManga && !isVideo;
        });

        console.log(`Found ${mangaResults.length} manga results.`);

        mangaResults.slice(0, 10).forEach((r: any, i: number) => {
            console.log(`[${i}] ${r.name}`);
            console.log(`    Magnet: ${r.magnet?.substring(0, 20)}...`);
            console.log(`    Size: ${r.filesize}`);
        });

        if (mangaResults.length === 0) {
            console.log("No manga results found.");
            return;
        }

        // Update Chapter 1 with the first result just to have something
        const bestMatch = mangaResults[0];
        console.log(`Selecting: ${bestMatch.name}`);

        const comic = await prisma.comic.findFirst({ where: { title: 'Solo Leveling' } });
        if (comic) {
            const chapter = await prisma.chapter.findFirst({
                where: { comicId: comic.id, number: 1 }
            });
            if (chapter) {
                await prisma.chapter.update({
                    where: { id: chapter.id },
                    data: { magnet: bestMatch.magnet }
                });
                console.log("✓ Updated Chapter 1 with magnet link.");
            }
        }

    } catch (e) {
        console.error(e);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
