'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Library, Home, Users, BookOpen, Menu, X, Moon, Sun, ZapOff, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { usePreferences } from '@/context/PreferencesContext';
import UserDropdown from '@/components/layout/UserDropdown';
import NotificationDropdown from '@/components/layout/NotificationDropdown';

const NAV_LINKS = [
    { href: '/',          label: 'Home',      icon: Home },
    { href: '/search',    label: 'Browse',    icon: Search },
    { href: '/library',   label: 'Library',   icon: Library },
    { href: '/community', label: 'Community', icon: Users },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { data: session } = useSession();
    const { focusMode, toggleFocusMode } = usePreferences();

    const [visible, setVisible]       = useState(true);
    const [lastY, setLastY]           = useState(0);
    const [scrolled, setScrolled]     = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [search, setSearch]         = useState('');

    const handleScroll = useCallback(() => {
        const y = window.scrollY;
        setScrolled(y > 8);
        setVisible(y < lastY || y < 50);
        setLastY(y);
    }, [lastY]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Close drawer on route change
    useEffect(() => { setDrawerOpen(false); }, [pathname]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/search?search=${encodeURIComponent(search.trim())}`);
            setSearch('');
        }
    };

    const cycleTheme = () => {
        if (theme === 'dark') setTheme('light');
        else if (theme === 'light') setTheme('system');
        else setTheme('dark');
    };

    const ThemeIcon = theme === 'light' ? Sun : theme === 'system' ? Monitor : Moon;

    // ── Focus Mode ─────────────────────────────────────────────────────
    if (focusMode) {
        return (
            <nav className={`sticky top-0 z-50 w-full border-b border-border/50 glass transition-transform duration-[var(--duration-base)] ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="container flex h-14 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-brand" />
                        <span className="font-bold">OmniRead</span>
                        <span className="text-[10px] font-mono text-warning border border-warning/30 bg-warning/10 px-1.5 rounded">FOCUS</span>
                    </Link>
                    <button
                        onClick={toggleFocusMode}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Exit focus mode"
                    >
                        <ZapOff size={15} /> Exit Focus
                    </button>
                </div>
            </nav>
        );
    }

    // ── Normal Navbar ───────────────────────────────────────────────────
    return (
        <>
            <nav
                className={`sticky top-0 z-50 w-full border-b transition-all duration-[var(--duration-base)] ${
                    scrolled ? 'glass border-border/60 shadow-sm' : 'bg-background border-transparent'
                } ${visible ? 'translate-y-0' : '-translate-y-full'}`}
            >
                <div className="container flex h-14 items-center gap-4 px-4">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="OmniRead home">
                        <BookOpen className="h-5 w-5 text-brand" aria-hidden />
                        <span className="hidden sm:block font-bold tracking-tight">OmniRead</span>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-1 ml-2">
                        {NAV_LINKS.map(({ href, label }) => {
                            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        active
                                            ? 'text-foreground bg-accent'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                    }`}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Desktop search */}
                    <form
                        onSubmit={handleSearch}
                        className="hidden md:flex items-center h-9 w-56 lg:w-72 rounded-md border border-input bg-background/50 px-3 gap-2 focus-within:ring-2 focus-within:ring-ring/50 transition-all"
                    >
                        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
                        <input
                            type="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search series…"
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            aria-label="Search"
                        />
                    </form>

                    {/* Theme toggle */}
                    <button
                        onClick={cycleTheme}
                        aria-label="Toggle theme"
                        className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <ThemeIcon className="h-4 w-4" aria-hidden />
                    </button>

                    {/* Notifications + User */}
                    <NotificationDropdown />
                    <UserDropdown />

                    {/* Mobile menu button */}
                    <button
                        className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        onClick={() => setDrawerOpen(o => !o)}
                        aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={drawerOpen}
                    >
                        {drawerOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
                    </button>
                </div>
            </nav>

            {/* ── Mobile drawer overlay ─────────────────────────────────── */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 md:hidden"
                    aria-hidden
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* ── Mobile drawer panel ───────────────────────────────────── */}
            <div
                className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-background border-r border-border shadow-xl flex flex-col transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)] md:hidden ${
                    drawerOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                role="dialog"
                aria-label="Navigation menu"
            >
                {/* Drawer header */}
                <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
                    <Link href="/" className="flex items-center gap-2 font-bold">
                        <BookOpen className="h-5 w-5 text-brand" aria-hidden />
                        OmniRead
                    </Link>
                    <button
                        onClick={() => setDrawerOpen(false)}
                        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        aria-label="Close menu"
                    >
                        <X className="h-4 w-4" aria-hidden />
                    </button>
                </div>

                {/* Drawer search */}
                <div className="px-4 py-3 border-b border-border">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 h-9 rounded-md border border-input bg-muted/50 px-3 focus-within:ring-2 focus-within:ring-ring/50">
                        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
                        <input
                            type="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search series…"
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </form>
                </div>

                {/* Drawer nav links */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-brand/10 text-brand'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                }`}
                            >
                                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Drawer footer: theme + sign-in */}
                <div className="p-4 border-t border-border space-y-2 shrink-0">
                    <button
                        onClick={cycleTheme}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <ThemeIcon className="h-4 w-4 shrink-0" aria-hidden />
                        {theme === 'light' ? 'Light mode' : theme === 'system' ? 'System theme' : 'Dark mode'}
                    </button>
                    {!session?.user && (
                        <Link
                            href="/api/auth/signin"
                            className="flex items-center justify-center gap-2 w-full h-9 rounded-lg text-sm font-medium bg-brand text-brand-foreground hover:bg-brand/90 transition-colors"
                        >
                            Sign in
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}
