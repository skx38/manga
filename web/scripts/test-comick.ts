import fetch from 'node-fetch';

const BASE_URL = 'https://comick-source-api.notaspider.dev';

async function main() {
    // 1. Get Sources
    console.log('--- Get Sources ---');
    try {
        const res = await fetch(`${BASE_URL}/api/sources`);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error('Error fetching sources:', e.message);
    }

    // 2. Search
    console.log('\n--- Search "Solo Leveling" ---');
    let mangaUrl = '';
    try {
        const res = await fetch(`${BASE_URL}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'solo leveling', source: 'all' })
        });
        const data = await res.json() as any;
        console.log(JSON.stringify(data, null, 2).slice(0, 500));

        // Try to find a URL to use for chapters
        if (data.results && data.results.length > 0) {
            mangaUrl = data.results[0].url;
        } else if (data.sources) {
            // Handle "all" sources response structure
            for (const s of data.sources) {
                if (s.results && s.results.length > 0) {
                    mangaUrl = s.results[0].url;
                    break;
                }
            }
        }
    } catch (e: any) {
        console.error('Error searching:', e.message);
    }

    // 3. Get Chapters
    if (mangaUrl) {
        console.log(`\n--- Get Chapters for ${mangaUrl} ---`);
        try {
            const res = await fetch(`${BASE_URL}/api/chapters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: mangaUrl })
            });
            const data = await res.json() as any;
            console.log(JSON.stringify(data, null, 2).slice(0, 500));
        } catch (e: any) {
            console.error('Error fetching chapters:', e.message);
        }
    }
}

main();
