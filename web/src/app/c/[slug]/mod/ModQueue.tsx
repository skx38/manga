'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, X as XIcon, Loader2, ShieldAlert, MessageSquare, FileText } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Report {
    id: string;
    reason: string;
    details?: string | null;
    status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
    createdAt: string;
    reporter: { id: string; username: string };
    post?: { id: string; title: string; comicId: string };
    comment?: { id: string; content: string; postId?: string | null };
}

export default function ModQueue({ comicId }: { comicId: string }) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'OPEN' | 'RESOLVED' | 'DISMISSED'>('OPEN');
    const [actingId, setActingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports?comicId=${comicId}&status=${filter}`);
            if (res.ok) setReports(await res.json());
        } finally {
            setLoading(false);
        }
    }, [comicId, filter]);

    useEffect(() => { load(); }, [load]);

    const resolve = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
        setActingId(id);
        try {
            await fetch('/api/reports', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            setReports((prev) => prev.filter((r) => r.id !== id));
        } finally {
            setActingId(null);
        }
    };

    const removeContent = async (report: Report) => {
        if (!report.post) return;
        await fetch('/api/community/posts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: report.post.id, isRemoved: true }),
        });
        await resolve(report.id, 'RESOLVED');
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b border-border">
                {(['OPEN', 'RESOLVED', 'DISMISSED'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            filter === s
                                ? 'border-brand text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="animate-spin mr-2" size={18} /> Loading reports…
                </div>
            ) : reports.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">No {filter.toLowerCase()} reports.</p>
            ) : (
                <div className="space-y-3">
                    {reports.map((r) => (
                        <article key={r.id} className="bg-card border border-border rounded-xl p-4">
                            <header className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning font-bold">
                                        {r.reason}
                                    </span>
                                    <span className="text-muted-foreground">
                                        Reported by <span className="font-medium text-foreground">@{r.reporter.username}</span>
                                        {' '}· {formatDistanceToNow(new Date(r.createdAt))} ago
                                    </span>
                                </div>
                                {r.post ? <FileText size={14} className="text-muted-foreground" /> : <MessageSquare size={14} className="text-muted-foreground" />}
                            </header>

                            {r.details && (
                                <p className="text-sm text-muted-foreground italic mb-3">&ldquo;{r.details}&rdquo;</p>
                            )}

                            <div className="bg-muted rounded-lg p-3 mb-3 text-sm">
                                {r.post ? (
                                    <Link href={`/community/post/${r.post.id}`} className="block hover:underline">
                                        <p className="font-medium text-foreground line-clamp-1">{r.post.title}</p>
                                    </Link>
                                ) : r.comment ? (
                                    <Link href={r.comment.postId ? `/community/post/${r.comment.postId}/comment/${r.comment.id}` : '#'} className="block hover:underline">
                                        <p className="text-foreground line-clamp-3">{r.comment.content}</p>
                                    </Link>
                                ) : (
                                    <p className="text-muted-foreground">Content unavailable.</p>
                                )}
                            </div>

                            {filter === 'OPEN' && (
                                <div className="flex gap-2 flex-wrap">
                                    {r.post && (
                                        <button
                                            onClick={() => removeContent(r)}
                                            disabled={actingId === r.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold transition-colors disabled:opacity-50"
                                        >
                                            <ShieldAlert size={13} /> Remove post
                                        </button>
                                    )}
                                    <button
                                        onClick={() => resolve(r.id, 'RESOLVED')}
                                        disabled={actingId === r.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success/10 text-success hover:bg-success/20 text-xs font-semibold transition-colors disabled:opacity-50"
                                    >
                                        <Check size={13} /> Mark resolved
                                    </button>
                                    <button
                                        onClick={() => resolve(r.id, 'DISMISSED')}
                                        disabled={actingId === r.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors disabled:opacity-50"
                                    >
                                        <XIcon size={13} /> Dismiss
                                    </button>
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
