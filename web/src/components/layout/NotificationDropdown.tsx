'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, MessageSquare, BookOpen, Info } from 'lucide-react';
import { usePreferences } from '@/context/PreferencesContext';

interface Notification {
    id: string;
    type: 'reply' | 'chapter' | 'system';
    title: string;
    message: string;
    time: string;
    read: boolean;
    link?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        type: 'chapter',
        title: 'New Chapter Available',
        message: 'Solo Leveling Chapter 180 has been released!',
        time: '2m ago',
        read: false,
        link: '/comic/solo-leveling'
    },
    {
        id: '2',
        type: 'reply',
        title: 'New Reply',
        message: 'User123 replied to your comment on "One Piece Theory"',
        time: '1h ago',
        read: false,
        link: '/community/post/123'
    },
    {
        id: '3',
        type: 'system',
        title: 'Welcome to OmniRead!',
        message: 'Thanks for joining our beta. Explore and enjoy!',
        time: '1d ago',
        read: true
    }
];

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { focusMode } = usePreferences();

    const unreadCount = notifications.filter(n => !n.read).length;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'chapter': return <BookOpen size={16} className="text-blue-400" />;
            case 'reply': return <MessageSquare size={16} className="text-green-400" />;
            default: return <Info size={16} className="text-gray-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors focus:outline-none"
            >
                <Bell size={20} />
                {unreadCount > 0 && !focusMode && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-950 animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900/50">
                        <h3 className="font-bold text-white text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No notifications
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer group ${notification.read ? 'opacity-60' : 'bg-gray-800/20'}`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notification.read ? 'bg-gray-800' : 'bg-gray-700'}`}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className={`text-sm font-medium truncate ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                                                    {notification.title}
                                                </h4>
                                                <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                                                    {notification.time}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="mt-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-2 bg-gray-900/50 border-t border-gray-800 text-center">
                        <button className="text-xs text-gray-500 hover:text-white transition-colors">
                            View all history
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
