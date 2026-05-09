const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ANILIST_API_URL = 'https://graphql.anilist.co';

const query = `
query ($search: String) {
  Media (search: $search, type: MANGA) {
    id
    title {
      romaji
      english
      native
    }
    coverImage {
      extraLarge
      large
      medium
    }
    bannerImage
  }
}
`;

async function fetchAnilistCover(title) {
    try {
        const response = await fetch(ANILIST_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { search: title }
            })
        });

        const data = await response.json();

        if (data.errors) {
            console.error(`  ⚠️  AniList error for "${title}":`, data.errors[0].message);
            return null;
        }

        return data.data.Media;
    } catch (error) {
        console.error(`  ❌ Failed to fetch from AniList for "${title}":`, error.message);
        return null;
    }
}

async function updateCoversFromAnilist() {
    console.log('🖼️  Fetching high-quality covers from AniList...\n');

    const comics = await prisma.comic.findMany();
    let updated = 0;
    let notFound = 0;

    for (const comic of comics) {
        // Clean title for better search results (remove special chars if needed)
        const searchTitle = comic.title;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 600));

        const media = await fetchAnilistCover(searchTitle);

        if (media && media.coverImage) {
            const coverUrl = media.coverImage.extraLarge || media.coverImage.large;

            if (coverUrl) {
                await prisma.comic.update({
                    where: { id: comic.id },
                    data: {
                        coverImageUrl: coverUrl,
                        // We could also update the description if we wanted, but let's stick to covers for now
                    },
                });
                console.log(`✓ Updated: ${comic.title}`);
                console.log(`  -> ${coverUrl}`);
                updated++;
            }
        } else {
            console.log(`⚠️  No match found on AniList for: ${comic.title}`);
            notFound++;
        }
    }

    console.log(`\n✅ Process complete!`);
    console.log(`   Updated: ${updated} covers`);
    console.log(`   Not Found: ${notFound} comics`);
}

updateCoversFromAnilist()
    .catch((e) => {
        console.error('❌ Script failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
