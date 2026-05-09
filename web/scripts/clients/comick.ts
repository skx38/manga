// Using native fetch (Node.js 18+)

export interface ComickChapter {
    id: string;
    number: number;
    title: string;
    publishAt: string;
}

export class ComickClient {
    private static readonly BASE_URL = 'https://api.comick.fun';

    /**
     * Get chapters for a manga
     * @param comicSlug - Comick manga slug (e.g., "solo-leveling")
     * @returns List of chapters
     */
    static async getChapters(comicSlug: string): Promise<ComickChapter[]> {
        const url = `${this.BASE_URL}/comic/${comicSlug}/chapters?lang=en`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Comick API error: ${response.statusText}`);
        }

        const data = await response.json() as any;

        return data.chapters.map((item: any) => ({
            id: item.hid,
            number: parseFloat(item.chap),
            title: item.title || `Chapter ${item.chap}`,
            publishAt: item.created_at,
        }));
    }

    /**
     * Get image URLs for a chapter
     * @param chapterId - Comick chapter ID (hid)
     * @returns Array of image URLs
     */
    static async getChapterImages(chapterId: string): Promise<string[]> {
        const url = `${this.BASE_URL}/chapter/${chapterId}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Comick API error: ${response.statusText}`);
        }

        const data = await response.json() as any;

        // Comick provides CDN URLs directly
        return data.chapter.md_images.map((img: any) => {
            // Use the high quality images
            return `https://meo.comick.pictures/${img.b2key}`;
        });
    }
}
