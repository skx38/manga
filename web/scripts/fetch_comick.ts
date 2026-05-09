import { PrismaClient, Origin, Status, PageMode } from '@prisma/client';

const prisma = new PrismaClient();

const API_BASE = "https://comick-source-api.notaspider.dev/api";

async function searchManga(query: string, source = "mangapark") {
    console.log(`Searching for "${query}" on ${source}...`);
    const res = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, source })
    });
    const data = await res.json();
    return data.results || [];
}

async function getChapters(url: string, source = "mangapark") {
    console.log(`Fetching chapters from ${url}...`);
    const res = await fetch(`${API_BASE}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, source })
    });
    const data = await res.json();
    return data.chapters || [];
}

function slugify(text: string) {
    return text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function main() {
    const comicsToFetch = [
        "One Piece",
        "Naruto",
        "Bleach",
        "Attack on Titan",
        "Demon Slayer",
        "My Hero Academia",
        "Jujutsu Kaisen",
        "Chainsaw Man",
        "Dragon Ball Super",
        "One Punch Man"
    ];

    console.log(`Starting bulk import of ${comicsToFetch.length} comics...`);

    for (const query of comicsToFetch) {
        try {
            const results = await searchManga(query);

            if (results.length === 0) {
                console.log(`No results found for "${query}".`);
                continue;
            }

            // Pick the first result
            const manga = results[0];
            console.log(`Found: ${manga.title} (${manga.url})`);

            // Map to Prisma Comic
            const comicSlug = slugify(manga.title);

            console.log(`Upserting Comic: ${manga.title}...`);
            const comic = await prisma.comic.upsert({
                where: { slug: comicSlug },
                update: {
                    coverImageUrl: manga.coverImage,
                    rating: parseFloat(manga.rating) || 0,
                },
                create: {
                    title: manga.title,
                    slug: comicSlug,
                    origin: Origin.JP, // Defaulting to JP for this list
                    type: 'Manga',     // Defaulting to Manga
                    status: Status.ONGOING, // Assumption
                    description: `Imported from ${manga.source || 'Comick API'}`,
                    coverImageUrl: manga.coverImage,
                    rating: parseFloat(manga.rating) || 0,
                }
            });

            // Fetch Chapters
            const chapters = await getChapters(manga.url);
            console.log(`Found ${chapters.length} chapters.`);

            // Upsert Chapters
            // Limit to first 20 for testing
            const chaptersToProcess = chapters.slice(0, 20);

            for (const ch of chaptersToProcess) {
                const chNum = parseFloat(ch.number);
                if (isNaN(chNum)) continue;

                const chSlug = `${comicSlug}-chapter-${chNum}`;

                await prisma.chapter.upsert({
                    where: {
                        comicId_slug: {
                            comicId: comic.id,
                            slug: chSlug
                        }
                    },
                    update: {
                        title: ch.title || `Chapter ${chNum}`,
                    },
                    create: {
                        comicId: comic.id,
                        number: chNum,
                        title: ch.title || `Chapter ${chNum}`,
                        slug: chSlug,
                        releaseDate: new Date(),
                        pageMode: PageMode.PAGE, // Default to PAGE for manga
                    }
                });
            }

            console.log(`Successfully imported ${chaptersToProcess.length} chapters for ${comic.title}`);

            // Be nice to the API
            await new Promise(r => setTimeout(r, 1000));

        } catch (err) {
            console.error(`Failed to process ${query}:`, err);
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
