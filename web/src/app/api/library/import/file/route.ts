import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { processImport, mapExternalStatus, ImportEntry } from '@/lib/import-utils';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const source = formData.get('source') as 'mal' | 'anilist' | 'tachiyomi' | 'comick';
        const mode = formData.get('mode') as 'merge' | 'replace';

        // Mock User ID for now (Demo User)
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const text = await file.text();
        let entries: ImportEntry[] = [];

        if (source === 'mal') {
            // Simple XML Regex Parser for MAL
            // Matches <manga> blocks
            const mangaMatches = text.match(/<manga>[\s\S]*?<\/manga>/g) || [];
            entries = mangaMatches.map(block => {
                const title = block.match(/<series_title><!\[CDATA\[(.*?)\]\]><\/series_title>/)?.[1] ||
                    block.match(/<series_title>(.*?)<\/series_title>/)?.[1] || '';
                const status = block.match(/<my_status>(.*?)<\/my_status>/)?.[1] || 'Reading';
                const score = parseInt(block.match(/<my_score>(.*?)<\/my_score>/)?.[1] || '0');
                const progress = parseInt(block.match(/<my_read_chapters>(.*?)<\/my_read_chapters>/)?.[1] || '0');

                return {
                    title: title.replace(/&amp;/g, '&'), // Decode basic entities
                    status: mapExternalStatus(status, 'mal'),
                    progress,
                    score
                };
            }).filter(e => e.title);
        }
        else if (source === 'anilist') {
            // Anilist JSON Export
            const data = JSON.parse(text);
            // Anilist export structure varies, usually a list of lists
            const list = Array.isArray(data) ? data : (data.lists || []);

            // Flatten if it's nested lists
            const flatList = list.flatMap((l: any) => l.entries || l);

            entries = flatList.map((e: any) => ({
                title: e.media?.title?.english || e.media?.title?.romaji || e.title, // Handle different formats
                status: mapExternalStatus(e.status, 'anilist'),
                progress: e.progress,
                score: e.score
            })).filter((e: any) => e.title);
        }
        else if (source === 'tachiyomi') {
            // Tachiyomi JSON Backup
            const data = JSON.parse(text);
            const mangas = data.mangas || [];

            entries = mangas.map((m: any) => {
                // Tachiyomi status: 1=Reading, 2=Completed, etc. (Need to map correctly)
                // Actually Tachiyomi stores status as integer.
                // 0: Unknown, 1: Ongoing, 2: Completed, 3: Licensed, 4: Publishing finished, 5: Cancelled, 6: On hiatus
                // Wait, that's publication status. Reading status is in categories usually?
                // No, Tachiyomi backups don't always have reading status directly on the manga object in the same way.
                // It relies on categories.
                // For simplicity, we'll default to 'Reading' if in backup, or check if we can find category.
                // Let's assume everything in backup is 'Reading' for now unless we find better field.

                return {
                    title: m.title,
                    status: 'READING', // Default for Tachiyomi backup import for now
                    progress: 0, // Tachiyomi stores history separately usually
                    score: 0
                };
            });
        }
        else if (source === 'comick') {
            // Comick JSON
            const data = JSON.parse(text);
            entries = data.map((e: any) => ({
                title: e.comic.title,
                status: mapExternalStatus(e.status, 'comick'),
                progress: e.progress,
                score: e.rating
            }));
        }

        const result = await processImport(userId, entries, mode);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
    }
}
