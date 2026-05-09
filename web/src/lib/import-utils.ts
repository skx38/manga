import { prisma } from './prisma';
import { LibraryStatus } from '@prisma/client';

export interface ImportEntry {
    title: string;
    status: LibraryStatus;
    progress?: number;
    score?: number;
}

export interface ImportResult {
    processed: number;
    matched: number;
    logs: string[];
}

export async function processImport(
    userId: string,
    entries: ImportEntry[],
    mode: 'merge' | 'replace'
): Promise<ImportResult> {
    const logs: string[] = [];
    let processed = 0;
    let matched = 0;

    // 1. Handle Replace Mode
    if (mode === 'replace') {
        await prisma.libraryEntry.deleteMany({
            where: { userId },
        });
        logs.push('Cleared existing library.');
    }

    // 2. Process Entries
    for (const entry of entries) {
        processed++;
        const normalizedTitle = entry.title.toLowerCase().trim();

        // Try exact match first
        let comic = await prisma.comic.findFirst({
            where: {
                title: {
                    equals: entry.title,
                    mode: 'insensitive',
                },
            },
        });

        // Try contains match if exact fails
        if (!comic) {
            comic = await prisma.comic.findFirst({
                where: {
                    title: {
                        contains: normalizedTitle,
                        mode: 'insensitive',
                    },
                },
            });
        }

        if (comic) {
            matched++;
            // Upsert Library Entry
            await prisma.libraryEntry.upsert({
                where: {
                    userId_comicId: {
                        userId,
                        comicId: comic.id,
                    },
                },
                update: {
                    status: entry.status,
                    score: entry.score ? Math.min(10, Math.max(1, entry.score)) : undefined,
                },
                create: {
                    userId,
                    comicId: comic.id,
                    status: entry.status,
                    score: entry.score ? Math.min(10, Math.max(1, entry.score)) : undefined,
                },
            });
            logs.push(`[MATCH] "${entry.title}" -> "${comic.title}"`);
        } else {
            logs.push(`[MISS] "${entry.title}" - Comic not found in database.`);
        }
    }

    return { processed, matched, logs };
}

export function mapExternalStatus(status: string, source: 'mal' | 'anilist' | 'tachiyomi' | 'comick'): LibraryStatus {
    const s = status.toLowerCase().replace(/_/g, ' ');

    if (['reading', 'current', 'watching'].includes(s)) return 'READING';
    if (['completed', 'finished'].includes(s)) return 'COMPLETED';
    if (['on hold', 'paused', 'on_hold'].includes(s)) return 'ON_HOLD';
    if (['dropped'].includes(s)) return 'DROPPED';
    if (['plan to read', 'planning', 'plan_to_read'].includes(s)) return 'PLAN_TO_READ';

    return 'READING'; // Default
}
