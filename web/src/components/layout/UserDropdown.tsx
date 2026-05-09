'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    User, Settings, LogOut, BookOpen, History, Upload,
    Bell, Users, Moon, Sun, Eye, EyeOff, Zap, ChevronRight, Star
} from 'lucide-react';
import { usePreferences } from '@/context/PreferencesContext';

interface UserData {
    username: string;
    avatar: string;
    level: number;
    rank: string;
    xp: number;
    karma: number;
    notifications: number;
}

export default function UserDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // User Data State
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    // Preferences Context
    const {
        darkMode, toggleDarkMode,
        adultFilter, toggleAdultFilter,
        focusMode, toggleFocusMode,
        isGuest, toggleGuestMode
    } = usePreferences();

    // Fetch User Data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/user/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!isGuest) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [isGuest]);

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

    if (loading) return <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse" />;

    // Guest View
    if (isGuest) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={toggleGuestMode}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                >
                    Sign In
                </button>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Avatar */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-600 overflow-hidden hover:border-blue-500 transition-colors focus:outline-none"
            >
                {/* <Image src={user.avatar} alt="User" fill /> */}
                <div className="w-full h-full flex items-center justify-center text-lg">👤</div>

                {/* Notification Dot */}
                {user.notifications > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-gray-900 rounded-full animate-pulse" />
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-80 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* 1. Identity Card */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 border-b border-gray-700">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-14 h-14 rounded-full bg-gray-700 border-2 border-blue-500 flex items-center justify-center text-2xl shadow-lg shadow-blue-900/20">
                                👤
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg leading-tight">{user.username}</h3>
                                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wide">
                                    <span>Lvl {user.level}</span>
                                    <span className="w-1 h-1 bg-gray-500 rounded-full" />
                                    <span>{user.rank}</span>
                                </div>
                            </div>
                        </div>

                        {/* XP Bar */}
                        <div className="mb-2">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                                <span>XP Progress</span>
                                <span>{user.xp}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-purple-500"
                                    style={{ width: `${user.xp}%` }}
                                />
                            </div>
                        </div>

                        {/* Karma Badge */}
                        <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md w-fit">
                            <Star size={12} fill="currentColor" />
                            <span>{user.karma.toLocaleString()} Karma</span>
                        </div>
                    </div>

                    {/* 2. Dashboard Quick Links */}
                    <div className="p-2">
                        <div className="grid grid-cols-1 gap-1">
                            {/* Cluster A: Library */}
                            <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Library</div>
                            <Link href="/library" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group">
                                <BookOpen size={18} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                                My List
                            </Link>
                            <Link href="/history" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group">
                                <History size={18} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                                History
                            </Link>

                            <div className="my-1 border-t border-gray-800" />

                            {/* Cluster B: Social */}
                            <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Social</div>
                            <Link href={`/u/${user.username}`} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group">
                                <User size={18} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
                                My Profile
                            </Link>
                        </div>
                    </div>

                    <div className="border-t border-gray-800" />

                    {/* 3. Quick Toggles */}
                    <div className="p-3 space-y-1">
                        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                                <span>Dark Mode</span>
                            </div>
                            <button
                                onClick={toggleDarkMode}
                                className={`w-8 h-4 rounded-full relative transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${darkMode ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                {adultFilter ? <EyeOff size={16} /> : <Eye size={16} />}
                                <span>Adult Filter</span>
                            </div>
                            <button
                                onClick={toggleAdultFilter}
                                className={`w-8 h-4 rounded-full relative transition-colors ${adultFilter ? 'bg-green-600' : 'bg-gray-600'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${adultFilter ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <Zap size={16} className={focusMode ? 'text-yellow-400' : ''} />
                                <span>Focus Mode</span>
                            </div>
                            <button
                                onClick={toggleFocusMode}
                                className={`w-8 h-4 rounded-full relative transition-colors ${focusMode ? 'bg-yellow-600' : 'bg-gray-600'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${focusMode ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-gray-800" />

                    {/* 4. Footer */}
                    <div className="p-2 bg-gray-900/50">
                        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                            <Settings size={16} />
                            Settings
                        </Link>
                        <button
                            onClick={toggleGuestMode}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors text-left"
                        >
                            <LogOut size={16} />
                            Log Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
