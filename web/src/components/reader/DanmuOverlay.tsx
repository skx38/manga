'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

export interface DanmuItem {
    id: string;
    pageIndex: number;
    text: string;
    trackY: number;
    color?: string | null;
    createdAt: string;
}

interface FlyingDanmu extends DanmuItem {
    key: string; // unique render key (allows replays)
    spawnedAt: number;
}

interface DanmuOverlayProps {
    chapterId: string;
    pageIndex: number;
    enabled: boolean;
    /** Optional: notify parent when input is focused (e.g., to disable keyboard nav). */
    onInputFocusChange?: (focused: boolean) => void;
}

const DURATION_MS = 8000;

export default function DanmuOverlay({ chapterId, pageIndex, enabled, onInputFocusChange }: DanmuOverlayProps) {
    const [items, setItems] = useState<DanmuItem[]>([]);
    const [flying, setFlying] = useState<FlyingDanmu[]>([]);
    const [draft, setDraft] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch backfill on mount / chapter change
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/community/danmu?chapterId=${chapterId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) setItems(data);
            } catch { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, [chapterId]);

    // Spawn comments for the current page in waves so they don't all fire at once.
    useEffect(() => {
        if (!enabled) {
            setFlying([]);
            return;
        }
        const onPage = items.filter((d) => d.pageIndex === pageIndex);
        const timers: ReturnType<typeof setTimeout>[] = [];
        onPage.forEach((d, i) => {
            const t = setTimeout(() => {
                const key = `${d.id}-${Date.now()}-${i}`;
                setFlying((prev) => [...prev, { ...d, key, spawnedAt: Date.now() }]);
                const cleanup = setTimeout(() => {
                    setFlying((prev) => prev.filter((f) => f.key !== key));
                }, DURATION_MS + 200);
                timers.push(cleanup);
            }, i * 600);
            timers.push(t);
        });
        return () => { timers.forEach(clearTimeout); };
    }, [items, pageIndex, enabled]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text || submitting) return;
        setSubmitting(true);

        const trackY = Math.random() * 0.85 + 0.05;
        const optimistic: DanmuItem = {
            id: `temp-${Date.now()}`,
            pageIndex,
            text,
            trackY,
            createdAt: new Date().toISOString(),
        };
        // Spawn it locally right away
        setFlying((prev) => [...prev, { ...optimistic, key: `${optimistic.id}-spawn`, spawnedAt: Date.now() }]);
        setDraft('');

        try {
            const res = await fetch('/api/community/danmu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapterId, pageIndex, text, trackY }),
            });
            if (res.ok) {
                const saved = await res.json();
                setItems((prev) => [...prev, saved]);
            }
        } catch { /* ignore */ }
        finally { setSubmitting(false); }
    };

    if (!enabled) return null;

    return (
        <div
            ref={containerRef}
            className="pointer-events-none absolute inset-0 overflow-hidden z-30"
            aria-hidden
        >
            {/* Flying comments */}
            {flying.map((d) => (
                <span
                    key={d.key}
                    className="absolute whitespace-nowrap font-bold text-base sm:text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)] animate-danmu-fly"
                    style={{
                        top: `${d.trackY * 100}%`,
                        right: `-${d.text.length}ch`,
                        color: d.color || '#fff',
                        animationDuration: `${DURATION_MS}ms`,
                    }}
                >
                    {d.text}
                </span>
            ))}

            {/* Submit bar */}
            <form
                onSubmit={submit}
                className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/85 backdrop-blur-md border border-border rounded-full px-3 py-1.5 shadow-lg max-w-[90%] w-[420px]"
            >
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, 120))}
                    onFocus={() => onInputFocusChange?.(true)}
                    onBlur={() => onInputFocusChange?.(false)}
                    placeholder="Send a danmu…"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    maxLength={120}
                />
                <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{draft.length}/120</span>
                <button
                    type="submit"
                    disabled={!draft.trim() || submitting}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-brand text-brand-foreground disabled:opacity-40 hover:bg-brand/90 transition-colors"
                    aria-label="Send danmu"
                >
                    <Send size={14} />
                </button>
            </form>
        </div>
    );
}
