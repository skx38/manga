// Using native fetch (Node.js 18+)

export interface MangaDexChapter {
    id: string;
    number: number;
    title: string;
    publishAt: string;
}

export class MangaDexClient {
    private static readonly BASE_URL = 'https://api.mangadex.org';

    /**
     * Get chapters for a manga
     * @param mangaId - MangaDex manga UUID
     * @returns List of chapters
     */
    static async getChapters(mangaId: string): Promise<MangaDexChapter[]> {
        const url = `${this.BASE_URL}/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=100`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`MangaDex API error: ${response.statusText}`);
        }

        const data = await response.json() as any;

        return data.data.map((item: any) => ({
            id: item.id,
            number: parseFloat(item.attributes.chapter),
            title: item.attributes.title || `Chapter ${item.attributes.chapter}`,
            publishAt: item.attributes.publishAt,
        }));
    }

    /**
     * Get image URLs for a chapter
     * @param chapterId - MangaDex chapter UUID
     * @returns Array of image URLs
     */
    static async getChapterImages(chapterId: string): Promise<string[]> {
        // Get chapter data
        const url = `${this.BASE_URL}/at-home/server/${chapterId}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`MangaDex API error: ${response.statusText}`);
        }

        const data = await response.json() as any;
        const baseUrl = data.baseUrl;
        const hash = data.chapter.hash;
        const files = data.chapter.data; // High quality images

        return files.map((filename: string) =>
            `${baseUrl}/data/${hash}/${filename}`
        );
    }
}
