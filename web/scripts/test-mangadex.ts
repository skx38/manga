
const BASE_URL = 'https://api.mangadex.org';

async function searchManga(title: string) {
    console.log(`Searching MangaDex for "${title}"...`);
    const params = new URLSearchParams();
    params.append('title', title);
    params.append('limit', '1');
    params.append('includes[]', 'author');
    params.append('includes[]', 'artist');
    params.append('includes[]', 'cover_art');

    try {
        const res = await fetch(`${BASE_URL}/manga?${params}`);
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);

        const data = await res.json() as any;
        if (data.data && data.data.length > 0) {
            const manga = data.data[0];
            const attrs = manga.attributes;

            console.log('--- Metadata Found ---');
            console.log(`Title: ${Object.values(attrs.title)[0]}`);
            console.log(`Original Language: ${attrs.originalLanguage}`);
            console.log(`Demographic: ${attrs.publicationDemographic}`);
            console.log(`Status: ${attrs.status}`);
            console.log(`Year: ${attrs.year}`);
            console.log(`Content Rating: ${attrs.contentRating}`);
            console.log(`Description: ${attrs.description.en ? attrs.description.en.slice(0, 100) + '...' : 'No description'}`);

            // Relationships
            const authors = manga.relationships.filter((r: any) => r.type === 'author').map((r: any) => r.attributes?.name).filter(Boolean);
            const artists = manga.relationships.filter((r: any) => r.type === 'artist').map((r: any) => r.attributes?.name).filter(Boolean);

            console.log(`Authors: ${authors.join(', ')}`);
            console.log(`Artists: ${artists.join(', ')}`);

            const genres = attrs.tags
                .filter((t: any) => t.attributes.group === 'genre')
                .map((t: any) => t.attributes.name.en);
            console.log(`Genres: ${genres.join(', ')}`);

            const themes = attrs.tags
                .filter((t: any) => t.attributes.group === 'theme')
                .map((t: any) => t.attributes.name.en);
            console.log(`Themes: ${themes.join(', ')}`);

            const formats = attrs.tags
                .filter((t: any) => t.attributes.group === 'format')
                .map((t: any) => t.attributes.name.en);
            console.log(`Formats: ${formats.join(', ')}`);

            console.log('----------------------\n');
        } else {
            console.log('No results found.');
        }
    } catch (e: any) {
        console.error(e.message);
    }
}

async function main() {
    await searchManga('Solo Leveling');
    await searchManga('One Piece');
}

main();
