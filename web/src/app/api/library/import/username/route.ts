import { NextRequest, NextResponse } from 'next/server';
import { processImport, mapExternalStatus, ImportEntry } from '@/lib/import-utils';

export async function POST(req: NextRequest) {
    try {
        const { username, source, mode } = await req.json();
        const userId = 'demo_user_id';

        if (!username || !source) {
            return NextResponse.json({ error: 'Missing username or source' }, { status: 400 });
        }

        let entries: ImportEntry[] = [];

        if (source === 'mal') {
            // Jikan API (MAL)
            // Note: Jikan is paginated. For simplicity, we'll fetch first page or all if possible.
            // Jikan v4 User Manga List
            // Try Jikan API first
            let data;
            try {
                const res = await fetch(`https://api.jikan.moe/v4/users/${username}/mangalist?limit=100`);
                if (res.ok) {
                    const jikanData = await res.json();
                    entries = jikanData.data.map((item: any) => ({
                        title: item.manga.title,
                        status: mapExternalStatus(item.reading_status, 'mal'),
                        progress: item.chapters_read,
                        score: item.score
                    }));
                } else {
                    throw new Error('Jikan API failed');
                }
            } catch (e) {
                console.log('Jikan API failed, trying scraping fallback...');
                // Fallback: Scrape MAL List Page
                const scrapeRes = await fetch(`https://myanimelist.net/mangalist/${username}?status=7`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                if (!scrapeRes.ok) {
                    if (scrapeRes.status === 404) throw new Error(`User '${username}' not found on MyAnimeList.`);
                    throw new Error('Failed to fetch from MAL (Scraping)');
                }

                const html = await scrapeRes.text();
                const match = html.match(/data-items="([^"]*)"/);

                if (match) {
                    const json = JSON.parse(match[1].replace(/&quot;/g, '"'));
                    entries = json.map((item: any) => {
                        let status = 'READING';
                        switch (item.status) {
                            case 1: status = 'READING'; break;
                            case 2: status = 'COMPLETED'; break;
                            case 3: status = 'ON_HOLD'; break;
                            case 4: status = 'DROPPED'; break;
                            case 6: status = 'PLAN_TO_READ'; break;
                        }
                        return {
                            title: item.manga_title,
                            status: status as any,
                            progress: item.num_read_chapters,
                            score: item.score
                        };
                    });
                } else {
                    throw new Error('Could not parse MAL list data.');
                }
            }
        }
        else if (source === 'anilist') {
            // Anilist GraphQL
            const query = `
                query ($username: String) {
                    MediaListCollection(userName: $username, type: MANGA) {
                        lists {
                            entries {
                                status
                                progress
                                score
                                media {
                                    title {
                                        english
                                        romaji
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const res = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    variables: { username }
                })
            });

            if (!res.ok) throw new Error('Failed to fetch from Anilist');

            const data = await res.json();
            if (data.errors) throw new Error(data.errors[0].message);

            const lists = data.data.MediaListCollection.lists;
            const flatEntries = lists.flatMap((l: any) => l.entries);

            entries = flatEntries.map((e: any) => ({
                title: e.media.title.english || e.media.title.romaji,
                status: mapExternalStatus(e.status, 'anilist'),
                progress: e.progress,
                score: e.score
            }));
        }

        console.log(`Fetching from ${source} for ${username}...`);

        // ... (existing fetch logic) ...

        console.log(`Found ${entries.length} entries. Processing import...`);
        const result = await processImport(userId, entries, mode);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Username import error:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json({ error: error.message || 'Import failed', details: error.toString() }, { status: 500 });
    }
}
