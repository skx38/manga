import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { calculateLevel, getLevelTitle } from '@/lib/gamification';
import StatCircle from '@/components/profile/StatCircle';
import ActivityHeatmap from '@/components/profile/ActivityHeatmap';
import { Calendar, MapPin, Link as LinkIcon, Flame, BookOpen, Trophy } from 'lucide-react';

// Helper to calculate stats
function calculateStats(stats: any[]) {
    if (!stats || stats.length === 0) {
        return { currentStreak: 0, longestStreak: 0, totalChapters: 0, daysActive: 0 };
    }

    // Sort by date descending
    const sortedStats = [...stats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Total Chapters & Days Active
    const totalChapters = sortedStats.reduce((acc, curr) => acc + curr.chaptersRead, 0);
    const daysActive = sortedStats.length;

    // Streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if active today or yesterday for current streak
    const lastActiveDate = new Date(sortedStats[0].date);
    lastActiveDate.setHours(0, 0, 0, 0);

    const isActiveToday = lastActiveDate.getTime() === today.getTime();
    const isActiveYesterday = lastActiveDate.getTime() === yesterday.getTime();

    if (isActiveToday || isActiveYesterday) {
        currentStreak = 1;
        let checkDate = new Date(lastActiveDate);

        for (let i = 1; i < sortedStats.length; i++) {
            checkDate.setDate(checkDate.getDate() - 1); // Expected previous day
            const prevDate = new Date(sortedStats[i].date);
            prevDate.setHours(0, 0, 0, 0);

            if (prevDate.getTime() === checkDate.getTime()) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // Calculate Longest Streak
    if (sortedStats.length > 0) {
        tempStreak = 1;
        longestStreak = 1;

        for (let i = 0; i < sortedStats.length - 1; i++) {
            const curr = new Date(sortedStats[i].date);
            const next = new Date(sortedStats[i + 1].date); // older date
            curr.setHours(0, 0, 0, 0);
            next.setHours(0, 0, 0, 0);

            const diffTime = Math.abs(curr.getTime() - next.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak, totalChapters, daysActive };
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;

    // Fetch User with Activity Data
    const user = await prisma.user.findUnique({
        where: { username },
        include: {
            readingStats: true,
            posts: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { comic: true }
            },
            comments: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    post: true,
                    chapter: {
                        include: { comic: true }
                    }
                }
            },
            readingProgress: {
                take: 5,
                orderBy: { lastRead: 'desc' },
                include: {
                    chapter: {
                        include: { comic: true }
                    }
                }
            }
        }
    });

    // Mock Data if user missing (for development preview)
    const profileUser: any = user || {
        username: username,
        image: '/avatars/default.png',
        bannerImage: '/banners/default.jpg',
        bio: 'Just a manga enthusiast navigating the multiverse.',
        createdAt: new Date(),
        xp: 1250,
        readingStats: [],
        posts: [],
        comments: [],
        readingProgress: []
    };

    const { level, progress } = calculateLevel(profileUser.xp);
    const title = getLevelTitle(level);

    // Mock Genre Data
    const genreData = [
        { name: 'Shonen', value: 60, color: '#ef4444' },
        { name: 'Horror', value: 25, color: '#8b5cf6' },
        { name: 'Romance', value: 15, color: '#ec4899' },
    ];

    // Mock Heatmap Data (if real stats empty)
    const heatmapData = profileUser.readingStats.length > 0
        ? profileUser.readingStats.map((s: any) => ({ date: s.date instanceof Date ? s.date.toISOString().split('T')[0] : s.date, count: s.chaptersRead }))
        : Array.from({ length: 100 }).map((_, i) => ({
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 10)
        }));

    const { currentStreak, longestStreak, totalChapters, daysActive } = calculateStats(profileUser.readingStats);

    // Combine and Sort Activity
    const activities = [
        ...profileUser.posts.map((p: any) => ({ type: 'post', date: p.createdAt, data: p })),
        ...profileUser.comments.map((c: any) => ({ type: 'comment', date: c.createdAt, data: c })),
        ...profileUser.readingProgress.map((r: any) => ({ type: 'read', date: r.lastRead, data: r }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return (
        <div className="min-h-screen bg-black pb-20">
            {/* Banner */}
            <div className="h-64 w-full relative bg-gray-800">
                {profileUser.bannerImage ? (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-900 to-purple-900" />
                )}
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Sidebar / Info */}
                    <div className="w-full md:w-80 shrink-0">
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl">
                            {/* Avatar */}
                            <div className="w-32 h-32 rounded-full border-4 border-black bg-gray-700 mx-auto -mt-20 mb-4 overflow-hidden relative">
                                {/* <Image src={profileUser.image} alt={profileUser.username} fill className="object-cover" /> */}
                                <div className="w-full h-full bg-gray-600 flex items-center justify-center text-4xl">👤</div>
                            </div>

                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-white mb-1">@{profileUser.username}</h1>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-400 text-xs font-bold uppercase tracking-wider">
                                    Lvl {level} {title}
                                </div>
                            </div>

                            {/* Level Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>XP</span>
                                    <span>{Math.round(progress)}% to next level</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                            </div>

                            <p className="text-gray-300 text-sm mb-6 text-center leading-relaxed">
                                {profileUser.bio}
                            </p>

                            <div className="space-y-3 text-sm text-gray-400">
                                <div className="flex items-center gap-3">
                                    <Calendar size={16} />
                                    <span>Joined {new Date(profileUser.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin size={16} />
                                    <span>The Internet</span>
                                </div>
                            </div>
                        </div>

                        {/* Stat Circle */}
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mt-6 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-4">Taste Profile</h3>
                            <StatCircle data={genreData} />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 w-full space-y-8">
                        {/* Heatmap & Stats */}
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <span className="text-2xl">📊</span> Reading Activity
                            </h3>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        <Flame size={14} className="text-orange-500" />
                                        Current Streak
                                    </div>
                                    <div className="text-2xl font-bold text-white">{currentStreak} <span className="text-sm text-gray-500 font-normal">Days</span></div>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        <BookOpen size={14} className="text-blue-500" />
                                        Total Chapters
                                    </div>
                                    <div className="text-2xl font-bold text-white">{totalChapters}</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        <Calendar size={14} className="text-green-500" />
                                        Days Active
                                    </div>
                                    <div className="text-2xl font-bold text-white">{daysActive}</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        <Trophy size={14} className="text-yellow-500" />
                                        Longest Streak
                                    </div>
                                    <div className="text-2xl font-bold text-white">{longestStreak} <span className="text-sm text-gray-500 font-normal">Days</span></div>
                                </div>
                            </div>

                            <ActivityHeatmap data={heatmapData} />
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {activities.length === 0 ? (
                                    <div className="text-gray-500 text-center py-8">No recent activity</div>
                                ) : (
                                    activities.map((activity, i) => {
                                        const { type, data, date } = activity;
                                        const timeAgo = new Date(date).toLocaleDateString(); // Simplify for server component

                                        if (type === 'read') {
                                            return (
                                                <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex gap-4">
                                                    <div className="w-12 h-16 bg-gray-700 rounded shrink-0 overflow-hidden relative">
                                                        {data.chapter.comic.coverImageUrl && (
                                                            <Image src={data.chapter.comic.coverImageUrl} alt="" fill className="object-cover" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-300 text-sm">
                                                            Read <span className="text-white font-bold">Chapter {data.chapter.number}</span> of <span className="text-blue-400">{data.chapter.comic.title}</span>
                                                        </p>
                                                        <span className="text-xs text-gray-500">{timeAgo}</span>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (type === 'post') {
                                            return (
                                                <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex gap-4">
                                                    <div className="w-12 h-16 bg-gray-700 rounded shrink-0 flex items-center justify-center text-2xl">
                                                        📝
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-300 text-sm">
                                                            Posted <span className="text-white font-bold">{data.title}</span> in <span className="text-blue-400">c/{data.comic.title}</span>
                                                        </p>
                                                        <span className="text-xs text-gray-500">{timeAgo}</span>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (type === 'comment') {
                                            const context = data.post ? `post "${data.post.title}"` : `Chapter ${data.chapter?.number}`;
                                            return (
                                                <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex gap-4">
                                                    <div className="w-12 h-16 bg-gray-700 rounded shrink-0 flex items-center justify-center text-2xl">
                                                        💬
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-300 text-sm">
                                                            Commented on <span className="text-white font-bold">{context}</span>
                                                        </p>
                                                        <p className="text-gray-400 text-xs mt-1 italic line-clamp-1">"{data.content}"</p>
                                                        <span className="text-xs text-gray-500">{timeAgo}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
