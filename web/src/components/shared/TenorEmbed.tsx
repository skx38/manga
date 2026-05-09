'use client';

import { useState, useEffect } from 'react';

interface TenorEmbedProps {
    id: string;
}

export default function TenorEmbed({ id }: TenorEmbedProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchUrl = async () => {
            try {
                const res = await fetch(`/api/proxy/tenor?id=${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.url) {
                        setImageUrl(data.url);
                    } else {
                        setError(true);
                    }
                } else {
                    setError(true);
                }
            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchUrl();
    }, [id]);

    if (loading) {
        return (
            <div className="my-2 w-full max-w-[400px] aspect-video rounded-lg bg-gray-800 animate-pulse flex items-center justify-center">
                <span className="text-gray-500 text-xs">Loading GIF...</span>
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div className="my-2 p-2 border border-gray-800 rounded bg-gray-900 text-xs text-gray-500">
                Failed to load Tenor GIF (ID: {id})
            </div>
        );
    }

    return (
        <div className="my-2">
            <img
                src={imageUrl}
                alt="Tenor GIF"
                className="max-w-full rounded-lg border border-gray-800"
                loading="lazy"
            />
        </div>
    );
}
