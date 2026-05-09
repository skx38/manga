const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const COMICK_API_BASE = 'https://comick-source-api.notaspider.dev/api';

// Popular comics to import
const POPULAR_COMICS = [
    'solo leveling',
    'one piece',
    'jujutsu kaisen',
    'chainsaw man',
    'tower of god',
    'omniscient reader',
    'the beginning after the end',
    'spy x family',
    'demon slayer',
    'black clover',
];

// Map Comick sources to our Origin enum
function getOriginFromTitle(title) {
    const titleLower = title.toLowerCase();
    // Korean manhwa indicators
    if (titleLower.includes('manhwa') || titleLower.includes('level') || titleLower.includes('tower')) {
        return 'KR';
    }
    // Chinese manhua indicators
    if (titleLower.includes('cultivation') || titleLower.includes('dao') || titleLower.includes('martial')) {
        return 'CN';
    }
    // Default to Japanese manga
    return 'JP';
}

// Determine type from source
function getTypeFromSource(source) {
    if (source && source.toLowerCase().includes('webtoon')) return 'Webtoon';
    if (source && source.toLowerCase().includes('manhwa')) return 'Manhwa';
    if (source && source.toLowerCase().includes('manhua')) return 'Manhua';
    return 'Manga';
}

// Create slug from title
function createSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function searchComic(query) {
    try {
        console.log(`Searching for: ${query}...`);
        const response = await fetch(`${COMICK_API_BASE}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                source: 'mangapark', // Using mangapark as primary source
            }),
        });

        if (!response.ok) {
            console.error(`Failed to search for ${query}`);
            return null;
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0]; // Return first result
        }
        return null;
    } catch (error) {
        console.error(`Error searching for ${query}:`, error.message);
        return null;
    }
}

async function getChapters(url, source = 'mangapark') {
    try {
        const response = await fetch(`${COMICK_API_BASE}/chapters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, source }),
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.chapters || [];
    } catch (error) {
        console.error(`Error fetching chapters:`, error.message);
        return [];
    }
}

async function importComic(searchResult) {
    try {
        const slug = createSlug(searchResult.title);

        // Check if comic already exists
        const existing = await prisma.comic.findUnique({ where: { slug } });
        if (existing) {
            console.log(`  ⏭️  ${searchResult.title} already exists, skipping...`);
            return null;
        }

        const origin = getOriginFromTitle(searchResult.title);
        const type = getTypeFromSource(searchResult.source);

        // Create comic
        const comic = await prisma.comic.create({
            data: {
                title: searchResult.title,
                slug,
                origin,
                type,
                status: 'ONGOING',
                description: `${searchResult.title} - Imported from ${searchResult.source || 'Comick API'}`,
                coverImageUrl: searchResult.coverImage || null,
            },
        });

        console.log(`  ✓ Created: ${comic.title} (${origin})`);

        // Try to fetch chapters (limit to first 5 for speed)
        if (searchResult.url) {
            console.log(`    Fetching chapters...`);
            const chapters = await getChapters(searchResult.url);
            const limitedChapters = chapters.slice(0, Math.min(5, chapters.length));

            for (const chapterData of limitedChapters) {
                const chapter = await prisma.chapter.create({
                    data: {
                        comicId: comic.id,
                        number: chapterData.number || parseFloat(chapterData.id) || 1,
                        title: chapterData.title || `Chapter ${chapterData.number}`,
                        slug: createSlug(chapterData.title || `chapter-${chapterData.number}`),
                        releaseDate: new Date(),
                        pageMode: origin === 'JP' ? 'PAGE' : 'STRIP',
                    },
                });

                // Create placeholder pages
                const pages = [];
                for (let i = 1; i <= 15; i++) {
                    pages.push({
                        chapterId: chapter.id,
                        orderIndex: i,
                        imageUrl: `https://picsum.photos/800/1200?random=${Date.now() + i}`,
                        width: 800,
                        height: 1200,
                    });
                }
                await prisma.page.createMany({ data: pages });
            }

            console.log(`    ✓ Added ${limitedChapters.length} chapters`);
        }

        return comic;
    } catch (error) {
        console.error(`  ❌ Error importing ${searchResult.title}:`, error.message);
        return null;
    }
}

async function main() {
    console.log('🌱 Importing comics from Comick API...\n');

    let imported = 0;
    let skipped = 0;

    for (const query of POPULAR_COMICS) {
        const searchResult = await searchComic(query);

        if (!searchResult) {
            console.log(`  ⚠️  No results for: ${query}`);
            skipped++;
            continue;
        }

        const comic = await importComic(searchResult);
        if (comic) {
            imported++;
        } else {
            skipped++;
        }

        // Small delay to not overwhelm the API
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Imported: ${imported} comics`);
    console.log(`   Skipped: ${skipped} comics`);
}

main()
    .catch((e) => {
        console.error('❌ Import failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
