'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, MessageSquare, AtSign, Shield } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { usePreferences } from '@/context/PreferencesContext';

interface ApiNotification {
    id: string;
    type: 'REPLY' | 'MENTION' | 'MOD_ACTION';
    readAt: string | null;
    createdAt: string;
    actor?: { id: string; username: string; image?: string };
    post?: { id: string; title: string };
    comment?: { id: string; content: string };
}

function typeIcon(type: ApiNotification['type']) {
    switch (type) {
        case 'REPLY': return <MessageSquare size={15} className="text-brand" />;
        case 'MENTION': return <AtSign size={15} className="text-success" />;
        case 'MOD_ACTION': return <Shield size={15} className="text-warning" />;
    }
}

function notificationLink(n: ApiNotification) {
    if (n.post && n.comment) return `/community/post/${n.post.id}/comment/${n.comment.id}`;
    if (n.post) return `/community/post/${n.post.id}`;
    return '/community';
}

function notificationText(n: ApiNotification) {
    const actor = n.actor?.username ?? 'Someone';
    switch (n.type) {
        case 'REPLY': return `${actor} replied to your comment`;
        case 'MENTION': return `${actor} mentioned you in a comment`;
        case 'MOD_ACTION': return 'A moderator took action on your content';
    }
}

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<ApiNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { focusMode } = usePreferences();

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications?limit=20');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch { /* non-fatal */ }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60_000); // poll every minute
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close on outside click.
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        setIsOpen((v) => !v);
        // Mark all read when opening.
        if (!isOpen && unreadCount > 0) {
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
            fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                aria-label="Notifications"
                className="relative p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && !focusMode && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground border-2 border-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-border">
                        {notifications.length === 0 ? (
                            <p className="p-8 text-center text-muted-foreground text-sm">No notifications yet.</p>
                        ) : (
                            notifications.map((n) => (
                                <Link
                                    key={n.id}
                                    href={notificationLink(n)}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex gap-3 px-4 py-3 hover:bg-accent transition-colors ${!n.readAt ? 'bg-brand/5' : ''}`}
                                >
                                    <div className="mt-0.5 w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                        {typeIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-snug ${!n.readAt ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                            {notificationText(n)}
                                        </p>
                                        {n.post && (
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                in &ldquo;{n.post.title}&rdquo;
                                            </p>
                                        )}
                                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                                            {formatDistanceToNow(new Date(n.createdAt))} ago
                                        </p>
                                    </div>
                                    {!n.readAt && <div className="mt-2 w-2 h-2 rounded-full bg-brand flex-shrink-0" />}
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
