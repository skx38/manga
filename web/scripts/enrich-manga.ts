import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'https://api.mangadex.org';

async function searchMangaDex(title: string) {
    const params = new URLSearchParams();
    params.append('title', title);
    params.append('limit', '1');
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');
    params.append('includes[]', 'cover_art');

    try {
        const res = await fetch(`${BASE_URL}/manga?${params}`);
        if (!res.ok) return null;

        const data = await res.json() as any;
        if (data.data && data.data.length > 0) {
            return data.data[0];
        }
    } catch (e) {
        console.error(`Error searching MangaDex for ${title}:`, e);
    }
    return null;
}

async function enrichComics() {
    const comics = await prisma.comic.findMany();
    console.log(`Found ${comics.length} comics to enrich...`);

    for (const comic of comics) {
        console.log(`Enriching "${comic.title}"...`);

        // Rate limit
        await new Promise(r => setTimeout(r, 200)); // 5 req/s max

        const mdManga = await searchMangaDex(comic.title);
        if (!mdManga) {
            console.log(`  No match found on MangaDex.`);
            continue;
        }

        const attrs = mdManga.attributes;

        // Extract genres/tags
        const tags = attrs.tags.map((t: any) => ({
            name: t.attributes.name.en,
            type: t.attributes.group
        }));

        // Extract relationships
        const authors = mdManga.relationships
            .filter((r: any) => r.type === 'author')
            .map((r: any) => r.attributes?.name)
            .filter(Boolean);

        const artists = mdManga.relationships
            .filter((r: any) => r.type === 'artist')
            .map((r: any) => r.attributes?.name)
            .filter(Boolean);

        // Map origin
        let origin = comic.origin;
        if (attrs.originalLanguage === 'ja') origin = 'JP';
        else if (attrs.originalLanguage === 'ko') origin = 'KR';
        else if (attrs.originalLanguage === 'zh') origin = 'CN';

        // Update Comic
        await prisma.comic.update({
            where: { id: comic.id },
            data: {
                publishedYear: attrs.year ? parseInt(attrs.year) : undefined,
                status: attrs.status ? attrs.status.toUpperCase() : undefined,
                description: attrs.description.en || comic.description,
                demographic: attrs.publicationDemographic,
                contentRating: attrs.contentRating ? attrs.contentRating.toUpperCase() : undefined,
                origin: origin,
                authors: authors,
                artists: artists,
            }
        });

        // Upsert Tags
        for (const tag of tags) {
            // Create Tag if not exists
            const dbTag = await prisma.tag.upsert({
                where: { name: tag.name },
                update: {},
                create: {
                    name: tag.name,
                    type: tag.type
                }
            });

            // Link to Comic
            try {
                await prisma.comicTag.create({
                    data: {
                        comicId: comic.id,
                        tagId: dbTag.id
                    }
                });
            } catch (e) {
                // Ignore duplicate links
            }
        }

        console.log(`  Updated metadata and added ${tags.length} tags.`);
    }
}

enrichComics()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
