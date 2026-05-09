import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
const BASE_URL = 'https://comick-source-api.notaspider.dev';

// List of manga to ingest
const MANGA_QUERIES = [
    'Solo Leveling',
    'One Piece',
    'Naruto',
    'Bleach',
    'Attack on Titan',
    'Jujutsu Kaisen',
    'Chainsaw Man',
    'Demon Slayer',
    'My Hero Academia',
    'Berserk'
];

interface MangaResult {
    title: string;
    url: string;
    coverImage?: string;
    rating?: string;
    followers?: string;
}

interface Source {
    results?: MangaResult[];
}

interface SearchResponse {
    results?: MangaResult[];
    sources?: Source[];
}

async function searchManga(query: string) {
    console.log(`Searching for "${query}"...`);
    try {
        const res = await fetch(`${BASE_URL}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, source: 'all' })
        });

        if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);

        const data = await res.json() as SearchResponse;

        // Flatten results from all sources
        let results: MangaResult[] = [];
        if (data.results) {
            results = data.results;
        } else if (data.sources) {
            for (const s of data.sources) {
                if (s.results) results.push(...s.results);
            }
        }

        return results;
    } catch (e: any) {
        console.error(`Error searching for ${query}:`, e.message);
        return [];
    }
}

async function getChapters(url: string) {
    console.log(`Fetching chapters from ${url}...`);
    try {
        const res = await fetch(`${BASE_URL}/api/chapters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!res.ok) throw new Error(`Get chapters failed: ${res.statusText}`);

        const data = await res.json() as any;
        return data.chapters || [];
    } catch (e: any) {
        console.error(`Error fetching chapters for ${url}:`, e.message);
        return [];
    }
}

function generateSlug(title: string): string {
    return title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function ingestManga(query: string) {
    const results = await searchManga(query);

    if (results.length === 0) {
        console.log(`No results found for "${query}"`);
        return;
    }

    // Pick the first result that looks promising (e.g., has a cover image)
    const manga = results.find(m => m.coverImage) || results[0];

    console.log(`Found: ${manga.title} (${manga.url})`);

    const slug = generateSlug(manga.title);

    // Upsert Comic
    const comic = await prisma.comic.upsert({
        where: { slug },
        update: {
            title: manga.title,
            coverImageUrl: manga.coverImage,
            rating: parseFloat(manga.rating || '0') || 0,
            views: parseInt((manga.followers || '0').replace(/[^0-9]/g, '')) || 0, // Rough estimate
        },
        create: {
            title: manga.title,
            slug,
            type: 'Manga', // Default
            origin: 'JP', // Default
            status: 'ONGOING', // Default
            coverImageUrl: manga.coverImage,
            rating: parseFloat(manga.rating || '0') || 0,
            description: `Imported from ${manga.url}`,
            views: parseInt((manga.followers || '0').replace(/[^0-9]/g, '')) || 0,
        }
    });

    console.log(`Upserted Comic: ${comic.title} (ID: ${comic.id})`);

    // Get Chapters
    const chapters = await getChapters(manga.url);
    console.log(`Found ${chapters.length} chapters`);

    // Ingest Chapters (limit to first 50 to avoid spamming if huge)
    // Reverse to ingest oldest first if list is new-first? 
    // Usually APIs return newest first. Let's reverse to keep order logical if we were inserting sequentially, 
    // but upsert doesn't care much.

    let ingestedCount = 0;
    for (const ch of chapters) {
        // Basic validation
        if (!ch.number && ch.number !== 0) continue;

        const chSlug = `chapter-${ch.number}`;

        try {
            await prisma.chapter.upsert({
                where: {
                    comicId_slug: { comicId: comic.id, slug: chSlug }
                },
                update: {
                    title: ch.title || `Chapter ${ch.number}`,
                },

                create: {
                    comicId: comic.id,
                    number: parseFloat(ch.number),
                    title: ch.title || `Chapter ${ch.number}`,
                    slug: chSlug,
                    releaseDate: new Date(), // API doesn't seem to return date for chapters easily
                }
            });
            ingestedCount++;
        } catch (e: any) {
            console.error(`Failed to upsert chapter ${ch.number}:`, e.message);
        }
    }
    console.log(`Ingested ${ingestedCount} chapters for ${comic.title}\n`);
}

async function main() {
    console.log('Starting ingestion...');

    for (const query of MANGA_QUERIES) {
        await ingestManga(query);
    }

    console.log('Ingestion complete!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
