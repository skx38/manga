const BASE_URL = 'https://comick-source-api.notaspider.dev/api';

export interface ComickManga {
    id: string;
    title: string;
    url: string;
    coverImage: string;
    latestChapter?: string | number;
    lastUpdated?: string;
    rating?: number;
    followers?: string;
}

export interface ComickChapter {
    id: string;
    number: number;
    title: string;
    url: string;
}

export const comick = {
    async search(query: string, source: string = 'all'): Promise<ComickManga[]> {
        try {
            const res = await fetch(`${BASE_URL}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, source }),
                next: { revalidate: 3600 } // Cache for 1 hour
            });

            if (!res.ok) return [];

            const data = await res.json();
            // Handle both single source (results array) and all sources (sources array)
            if (data.results) return data.results;
            if (data.sources) {
                // Flatten results from all sources
                return data.sources.flatMap((s: any) => s.results || []);
            }
            return [];
        } catch (error) {
            console.error('Comick search failed:', error);
            return [];
        }
    },

    async getChapters(url: string, source?: string): Promise<ComickChapter[]> {
        try {
            const res = await fetch(`${BASE_URL}/chapters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, source }),
                next: { revalidate: 3600 }
            });

            if (!res.ok) return [];
            const data = await res.json();
            return data.chapters || [];
        } catch (error) {
            console.error('Comick chapters failed:', error);
            return [];
        }
    }
};
