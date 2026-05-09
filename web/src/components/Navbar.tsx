'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Library, Home, Menu, ZapOff } from 'lucide-react';
import UserDropdown from '@/components/layout/UserDropdown';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import { usePreferences } from '@/context/PreferencesContext';

export default function Navbar() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { focusMode, toggleFocusMode } = usePreferences();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsVisible(false); // Scrolling down
            } else {
                setIsVisible(true); // Scrolling up
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Focus Mode: Simplified Navbar
    if (focusMode) {
        return (
            <nav
                className={`sticky top-0 z-40 w-full border-b border-gray-800 bg-black/90 backdrop-blur transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
                    }`}
            >
                <div className="container flex h-14 items-center justify-between px-4">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="font-bold text-white">OmniRead</span>
                        <span className="text-xs text-yellow-500 font-mono border border-yellow-500/30 bg-yellow-500/10 px-1 rounded">FOCUS</span>
                    </Link>

                    <button
                        onClick={toggleFocusMode}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <ZapOff size={16} />
                        Exit Focus
                    </button>
                </div>
            </nav>
        );
    }

    return (
        <nav
            className={`sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <div className="container flex h-14 items-center px-4">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block text-white">
                            OmniRead
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link
                            href="/"
                            className="transition-colors hover:text-foreground/80 text-foreground/60 text-gray-400 hover:text-white"
                        >
                            Home
                        </Link>
                        <Link
                            href="/search"
                            className="transition-colors hover:text-foreground/80 text-foreground/60 text-gray-400 hover:text-white"
                        >
                            Browse
                        </Link>
                        <Link
                            href="/library"
                            className="transition-colors hover:text-foreground/80 text-foreground/60 text-gray-400 hover:text-white"
                        >
                            Library
                        </Link>
                        <Link
                            href="/community"
                            className="transition-colors hover:text-foreground/80 text-foreground/60 text-gray-400 hover:text-white"
                        >
                            Community
                        </Link>
                    </nav>
                </div>

                {/* Mobile Menu Button (Placeholder) */}
                <button className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 py-2 mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden text-white">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </button>

                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Search Bar Placeholder */}
                    </div>
                    <nav className="flex items-center space-x-4">
                        <Link href="/search">
                            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 py-2 w-9 px-0 text-gray-400 hover:text-white">
                                <Search className="h-5 w-5" />
                                <span className="sr-only">Search</span>
                            </div>
                        </Link>

                        {/* Notification Dropdown */}
                        <NotificationDropdown />

                        {/* User Dropdown */}
                        <UserDropdown />
                    </nav>
                </div>
            </div>
        </nav>
    );
}
