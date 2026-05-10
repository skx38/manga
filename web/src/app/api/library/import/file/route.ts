import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { processImport, mapExternalStatus, ImportEntry } from '@/lib/import-utils';
import { readMihonFile } from '@/lib/mihon-proto';

type ImportSource = 'mal' | 'anilist' | 'tachiyomi' | 'mihon' | 'comick';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const source = formData.get('source') as ImportSource;
        const mode = formData.get('mode') as 'merge' | 'replace';

        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        let entries: ImportEntry[] = [];

        // Mihon protobuf backup (.proto.gz or .proto) — binary decode path
        if (source === 'mihon') {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            try {
                entries = readMihonFile(buffer);
            } catch (err: any) {
                return NextResponse.json(
                    { error: `Failed to decode Mihon backup: ${err.message}` },
                    { status: 400 }
                );
            }
            const result = await processImport(userId, entries, mode);
            return NextResponse.json(result);
        }

        // All other formats are text-based
        const text = await file.text();

        if (source === 'mal') {
            const mangaMatches = text.match(/<manga>[\s\S]*?<\/manga>/g) || [];
            entries = mangaMatches.map(block => {
                const title = block.match(/<series_title><!\[CDATA\[(.*?)\]\]><\/series_title>/)?.[1] ||
                    block.match(/<series_title>(.*?)<\/series_title>/)?.[1] || '';
                const status = block.match(/<my_status>(.*?)<\/my_status>/)?.[1] || 'Reading';
                const score = parseInt(block.match(/<my_score>(.*?)<\/my_score>/)?.[1] || '0');
                const progress = parseInt(block.match(/<my_read_chapters>(.*?)<\/my_read_chapters>/)?.[1] || '0');

                return {
                    title: title.replace(/&amp;/g, '&'),
                    status: mapExternalStatus(status, 'mal'),
                    progress,
                    score,
                };
            }).filter(e => e.title);
        }
        else if (source === 'anilist') {
            const data = JSON.parse(text);
            const list = Array.isArray(data) ? data : (data.lists || []);
            const flatList = list.flatMap((l: any) => l.entries || l);

            entries = flatList.map((e: any) => ({
                title: e.media?.title?.english || e.media?.title?.romaji || e.title,
                status: mapExternalStatus(e.status, 'anilist'),
                progress: e.progress,
                score: e.score,
            })).filter((e: any) => e.title);
        }
        else if (source === 'tachiyomi') {
            // Legacy Tachiyomi JSON backup format
            const data = JSON.parse(text);
            const mangas = data.mangas || [];
            const categories: { name: string }[] = data.categories || [];

            entries = mangas.map((m: any) => {
                // Derive status from category names when present
                let status: ImportEntry['status'] = 'READING';
                if (Array.isArray(m.categories) && m.categories.length > 0 && categories.length > 0) {
                    for (const idx of m.categories as number[]) {
                        const name = (categories[idx]?.name ?? '').toLowerCase();
                        if (['completed', 'finished'].includes(name)) { status = 'COMPLETED'; break; }
                        if (['on hold', 'paused'].includes(name)) { status = 'ON_HOLD'; break; }
                        if (['dropped'].includes(name)) { status = 'DROPPED'; break; }
                        if (['plan to read', 'planning'].includes(name)) { status = 'PLAN_TO_READ'; break; }
                    }
                }
                const readCount = Array.isArray(m.chapters)
                    ? (m.chapters as any[]).filter(c => c.read).length
                    : 0;
                return { title: m.title, status, progress: readCount, score: 0 };
            }).filter((e: any) => e.title);
        }
        else if (source === 'comick') {
            const data = JSON.parse(text);
            entries = data.map((e: any) => ({
                title: e.comic.title,
                status: mapExternalStatus(e.status, 'comick'),
                progress: e.progress,
                score: e.rating,
            }));
        }

        const result = await processImport(userId, entries, mode);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
    }
}
