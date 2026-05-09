#!/usr/bin/env tsx
/**
 * OmniRead Manga Ingestion CLI
 * 
 * Usage:
 *   npx tsx scripts/ingest.ts --manga "Solo Leveling" --source comick --chapters 1,2,3
 *   npx tsx scripts/ingest.ts --manga "One Piece" --source mangadex --all
 */

import { ingestMangaChapters } from './ingest-manga';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);

    // Parse arguments
    const mangaTitle = args[args.indexOf('--manga') + 1];
    const source = args[args.indexOf('--source') + 1] as 'mangadex' | 'comick';
    const chaptersArg = args[args.indexOf('--chapters') + 1];
    const all = args.includes('--all');

    if (!mangaTitle || !source) {
        console.log(`
OmniRead Manga Ingestion CLI

Usage:
  npx tsx scripts/ingest.ts --manga "Title" --source [mangadex|comick] [--chapters 1,2,3 | --all]

Examples:
  npx tsx scripts/ingest.ts --manga "Solo Leveling" --source comick --chapters 1,2,3
  npx tsx scripts/ingest.ts --manga "One Piece" --source mangadex --all
  
Options:
  --manga      Manga title (exact match from database)
  --source     API source: mangadex or comick
  --chapters   Comma-separated chapter numbers (e.g., 1,2,3,10-15)
  --all        Download all available chapters
    `);
        return;
    }

    // Find manga in database
    const manga = await prisma.comic.findFirst({
        where: {
            title: {
                contains: mangaTitle,
                mode: 'insensitive',
            }
        }
    });

    if (!manga) {
        console.error(`Manga "${mangaTitle}" not found in database.`);
        console.log('\nAvailable manga:');
        const allComics = await prisma.comic.findMany({ select: { title: true } });
        allComics.forEach(c => console.log(`  - ${c.title}`));
        return;
    }

    // Parse chapters
    let chapters: number[] | undefined;
    if (!all && chaptersArg) {
        chapters = chaptersArg.split(',').flatMap(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i);
            }
            return [Number(part)];
        });
    }

    // For now, use the manga slug as external ID (this works for Comick)
    // For MangaDex, you'd need to map to actual MangaDex UUIDs
    const externalId = source === 'comick' ? manga.slug : 'MANGADEX_ID_HERE';

    console.log(`\nIngesting "${manga.title}" from ${source}`);
    console.log(`Chapters: ${all ? 'ALL' : chapters?.join(', ')}\n`);

    await ingestMangaChapters({
        mangaId: manga.id,
        externalId,
        source,
        chapters,
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
