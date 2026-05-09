
const BASE_URL_SOURCE = 'https://comick-source-api.notaspider.dev';
const BASE_URL_OFFICIAL = 'https://api.comick.io';

async function fetchDetails(baseUrl: string, slug: string, label: string) {
    console.log(`\nTesting ${label} for "${slug}"...`);
    try {
        const res = await fetch(`${baseUrl}/comic/${slug}`);
        if (!res.ok) {
            console.log(`${label} Error: ${res.status} ${res.statusText}`);
            return;
        }
        const data = await res.json() as any;

        // Log relevant fields if they exist
        const comic = data.comic || data;
        console.log(`--- ${label} Data ---`);
        console.log(`Title: ${comic.title}`);
        console.log(`Desc: ${comic.desc?.slice(0, 50)}...`);
        console.log(`Status: ${comic.status}`);
        console.log(`Year: ${comic.year}`);
        console.log(`Demographic: ${comic.demographic}`);
        console.log(`Country: ${comic.country}`);

        if (comic.md_comic_md_genres) {
            console.log(`Genres: ${comic.md_comic_md_genres.map((g: any) => g.md_genres.name).join(', ')}`);
        }

        if (comic.authors) {
            console.log(`Authors: ${comic.authors.map((a: any) => a.name).join(', ')}`);
        }

        if (comic.artists) {
            console.log(`Artists: ${comic.artists.map((a: any) => a.name).join(', ')}`);
        }

        console.log(`Slug: ${comic.slug}`);
        console.log(`-------------------\n`);

    } catch (e: any) {
        console.error(`${label} Exception:`, e.message);
    }
}

async function main() {
    console.log('Searching for "Solo Leveling"...');
    try {
        const searchRes = await fetch(`${BASE_URL_SOURCE}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'Solo Leveling', source: 'all' })
        });
        const searchData = await searchRes.json() as any;

        let slug = '';

        // Check results array
        if (searchData.results && searchData.results.length > 0) {
            const first = searchData.results[0];
            // console.log('First result:', JSON.stringify(first, null, 2));
            slug = first.url || first.slug;
        }
        // Check sources array
        else if (searchData.sources) {
            for (const s of searchData.sources) {
                if (s.results && s.results.length > 0) {
                    const first = s.results[0];
                    // console.log('First result (from source):', JSON.stringify(first, null, 2));
                    slug = first.url || first.slug;
                    break;
                }
            }
        }

        if (slug) {
            // Clean slug if it's a full URL
            if (slug.startsWith('http')) {
                const parts = slug.split('/');
                slug = parts[parts.length - 1] || parts[parts.length - 2];
            }
            console.log(`Found slug/url: ${slug}`);

            await fetchDetails(BASE_URL_OFFICIAL, slug, 'Official API');
            await fetchDetails(BASE_URL_SOURCE, slug, 'Source API');
        } else {
            console.log('Search returned no results.');
        }
    } catch (e: any) {
        console.error('Search Error:', e.message);
    }
}

main();
