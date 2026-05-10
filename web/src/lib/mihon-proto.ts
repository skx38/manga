import protobuf from 'protobufjs';
import { gunzipSync } from 'zlib';
import type { LibraryStatus } from '@prisma/client';
import type { ImportEntry } from './import-utils';

// Mihon/Tachiyomi backup protobuf descriptor (proto3)
// Mirrors https://github.com/mihonapp/mihon/blob/main/app/src/main/proto/backup.proto
const DESCRIPTOR: protobuf.INamespace = {
    nested: {
        Backup: {
            fields: {
                backupManga: { rule: 'repeated', type: 'BackupManga', id: 1 },
                backupCategories: { rule: 'repeated', type: 'BackupCategory', id: 2 },
            },
        },
        BackupManga: {
            fields: {
                source: { type: 'int64', id: 1 },
                url: { type: 'string', id: 2 },
                title: { type: 'string', id: 3 },
                artist: { type: 'string', id: 4 },
                author: { type: 'string', id: 5 },
                description: { type: 'string', id: 6 },
                genre: { rule: 'repeated', type: 'string', id: 7 },
                status: { type: 'int32', id: 8 },
                thumbnailUrl: { type: 'string', id: 9 },
                chapters: { rule: 'repeated', type: 'BackupChapter', id: 10 },
                categories: { rule: 'repeated', type: 'int32', id: 11 },
                tracking: { rule: 'repeated', type: 'BackupTracking', id: 12 },
                favorite: { type: 'int64', id: 13 },
                dateAdded: { type: 'int64', id: 17 },
                history: { rule: 'repeated', type: 'BackupHistory', id: 16 },
                lastModifiedAt: { type: 'int64', id: 100 },
                customTitle: { type: 'string', id: 200 },
                customScore: { type: 'float', id: 207 },
            },
        },
        BackupChapter: {
            fields: {
                url: { type: 'string', id: 1 },
                name: { type: 'string', id: 2 },
                scanlator: { type: 'string', id: 3 },
                read: { type: 'bool', id: 4 },
                bookmark: { type: 'bool', id: 5 },
                lastPageRead: { type: 'int64', id: 6 },
                dateFetch: { type: 'int64', id: 7 },
                dateUpload: { type: 'int64', id: 8 },
                chapterNumber: { type: 'float', id: 9 },
                sourceOrder: { type: 'int32', id: 10 },
            },
        },
        BackupCategory: {
            fields: {
                name: { type: 'string', id: 1 },
                order: { type: 'int32', id: 2 },
                flags: { type: 'int64', id: 3 },
            },
        },
        BackupHistory: {
            fields: {
                url: { type: 'string', id: 1 },
                lastRead: { type: 'int64', id: 2 },
                readDuration: { type: 'int64', id: 3 },
            },
        },
        BackupTracking: {
            fields: {
                syncId: { type: 'int32', id: 1 },
                libraryId: { type: 'int64', id: 2 },
                mediaId: { type: 'int64', id: 3 },
                trackingUrl: { type: 'string', id: 4 },
                title: { type: 'string', id: 5 },
                lastChapterRead: { type: 'float', id: 6 },
                totalChapters: { type: 'int32', id: 7 },
                score: { type: 'float', id: 8 },
                status: { type: 'int32', id: 9 },
                startedReadingDate: { type: 'int64', id: 10 },
                finishedReadingDate: { type: 'int64', id: 11 },
            },
        },
    },
};

// Category name → OmniRead library status
function categoryNameToStatus(name: string): LibraryStatus | null {
    const n = name.toLowerCase().trim();
    if (['reading', 'current', 'watching'].includes(n)) return 'READING';
    if (['completed', 'finished', 'done'].includes(n)) return 'COMPLETED';
    if (['on hold', 'on-hold', 'paused', 'hold'].includes(n)) return 'ON_HOLD';
    if (['dropped', 'dnf'].includes(n)) return 'DROPPED';
    if (['plan to read', 'plan to watch', 'planning', 'ptr', 'ptw', 'want to read'].includes(n)) return 'PLAN_TO_READ';
    return null;
}

// Infer reading status from a manga's category indices + the global category list.
// Falls back to READING (most manga in a Mihon library are actively being read).
function deriveStatus(categoryIndices: number[], allCategories: { name?: string }[]): LibraryStatus {
    for (const idx of categoryIndices) {
        const cat = allCategories[idx];
        if (!cat) continue;
        const mapped = categoryNameToStatus(cat.name ?? '');
        if (mapped) return mapped;
    }
    return 'READING';
}

interface DecodedBackup {
    backupManga: Array<{
        title?: string;
        categories?: number[];
        chapters?: Array<{ read?: boolean }>;
        favorite?: number | bigint;
        customTitle?: string;
        customScore?: number;
        tracking?: Array<{ score?: number; lastChapterRead?: number }>;
    }>;
    backupCategories: Array<{ name?: string; order?: number }>;
}

/** Decode a Mihon/Tachiyomi protobuf backup buffer into ImportEntry[]. */
export function decodeMihonBackup(buffer: Buffer): ImportEntry[] {
    const root = protobuf.Root.fromJSON(DESCRIPTOR);
    const BackupType = root.lookupType('Backup');

    const decoded = BackupType.decode(buffer) as unknown as DecodedBackup;
    const categories = decoded.backupCategories ?? [];
    const mangas = decoded.backupManga ?? [];

    const entries: ImportEntry[] = [];

    for (const manga of mangas) {
        // Skip non-favorited entries (not in library)
        const fav = Number(manga.favorite ?? 0);
        if (fav === 0) continue;

        const title = (manga.customTitle?.trim() || manga.title?.trim() || '').trim();
        if (!title) continue;

        const status = deriveStatus(manga.categories ?? [], categories);

        // Count read chapters for progress tracking
        const chapters = manga.chapters ?? [];
        const readCount = chapters.filter((c) => c.read).length;

        // Prefer score from an external tracker (MAL=1, Anilist=2, etc.)
        let score: number | undefined;
        if (manga.customScore && manga.customScore > 0) {
            score = Math.round(manga.customScore);
        } else {
            const trackerScore = manga.tracking?.find((t) => t.score && t.score > 0)?.score;
            if (trackerScore) score = Math.round(trackerScore);
        }
        // Clamp to 1-10 range expected by processImport
        if (score !== undefined) score = Math.min(10, Math.max(1, score));

        entries.push({ title, status, progress: readCount, score });
    }

    return entries;
}

/** Auto-detect and decompress a Mihon backup file.
 *  Mihon exports as `.proto.gz` (gzipped protobuf). Tachiyomi older versions
 *  used plain `.proto` (non-compressed). Both are handled here.
 */
export function readMihonFile(buffer: Buffer): ImportEntry[] {
    // gzip magic bytes: 0x1f 0x8b
    const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b;
    const protoBuffer = isGzip ? gunzipSync(buffer) : buffer;
    return decodeMihonBackup(protoBuffer);
}
