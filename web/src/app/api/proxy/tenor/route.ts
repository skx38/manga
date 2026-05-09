import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    try {
        // Construct a likely URL structure. Tenor IDs are unique, the slug part is flexible but we need it to fetch.
        // Actually, we can't easily guess the slug.
        // But wait, the user input usually HAS the slug: tenor.com/view/slug-id
        // The RichTextParser extracts just the ID.
        // I should probably pass the FULL URL to this API if possible, or just the ID if I can find a way to lookup by ID.

        // Tenor doesn't have a public "lookup by ID" URL that redirects without the slug?
        // Let's try `tenor.com/view/${id}` -> usually redirects?

        const res = await fetch(`https://tenor.com/view/gif-${id}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OmniRead/1.0;)'
            }
        });

        if (!res.ok) {
            // Try without 'gif-' prefix?
            const res2 = await fetch(`https://tenor.com/view/${id}`);
            if (!res2.ok) throw new Error('Failed to fetch Tenor page');
            const html = await res2.text();
            const $ = cheerio.load(html);
            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage) return NextResponse.json({ url: ogImage });
        } else {
            const html = await res.text();
            const $ = cheerio.load(html);
            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage) return NextResponse.json({ url: ogImage });
        }

        return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    } catch (error) {
        console.error('Tenor proxy error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
