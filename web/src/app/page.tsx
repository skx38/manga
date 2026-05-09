import ComicCard from '@/components/ComicCard';
import UpNextCarousel from '@/components/dashboard/UpNextCarousel';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import StatsOverview from '@/components/dashboard/StatsOverview';
import ReadingHeatmap from '@/components/dashboard/ReadingHeatmap';
import { startOfDay, subDays, differenceInDays, isSameDay } from 'date-fns';
import { BookOpen } from 'lucide-react';
import HeroCarousel from '@/components/dashboard/HeroCarousel';
import { getPersonalizedRecommendations } from '@/lib/recommendations';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';


async function getTrendingComics() {
  const comics = await (prisma.comic as any).findMany({
    orderBy: { views: 'desc' },
    take: 10,
  });

  return comics.map((comic: any) => ({
    id: comic.id,
    title: comic.title,
    coverUrl: comic.coverImageUrl || '/placeholder-cover.svg',
    type: comic.type,
    rating: comic.rating || 0,
    tags: []
  }));
}

async function getUpdates() {
  const comics = await prisma.comic.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  return comics.map(comic => ({
    id: comic.id,
    title: comic.title,
    coverUrl: comic.coverImageUrl || '/placeholder-cover.svg',
    type: comic.type,
    rating: comic.rating || 0,
    tags: []
  }));
}

async function getRecommendedComics() {
  const userId = 'demo_user_id';
  const comics = await getPersonalizedRecommendations(userId, 10);

  return comics.map((comic: any) => ({
    id: comic.id,
    title: comic.title,
    coverUrl: comic.coverImageUrl || '/placeholder-cover.svg',
    type: comic.type,
    rating: comic.rating || 0,
    tags: []
  }));
}

async function getReadingStats() {
  const userId = 'demo_user_id';

  try {
    const stats = await (prisma as any).userReadingStat.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    });

    const totalChapters = stats.reduce((acc: number, curr: any) => acc + curr.chaptersRead, 0);
    const daysActive = stats.length;

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedStats = [...stats].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Longest Streak
    for (let i = 0; i < sortedStats.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedStats[i - 1].date);
        const currDate = new Date(sortedStats[i].date);
        const diff = differenceInDays(currDate, prevDate);

        if (diff === 1) {
          tempStreak++;
        } else if (diff > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    // Current Streak
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);
    const readToday = sortedStats.some(s => isSameDay(new Date(s.date), today));
    const readYesterday = sortedStats.some(s => isSameDay(new Date(s.date), yesterday));

    if (readToday || readYesterday) {
      let streakCount = 0;
      let checkDate = readToday ? today : yesterday;
      for (let i = sortedStats.length - 1; i >= 0; i--) {
        const statDate = new Date(sortedStats[i].date);
        if (isSameDay(statDate, checkDate)) {
          streakCount++;
          checkDate = subDays(checkDate, 1);
        } else if (statDate < checkDate) {
          break;
        }
      }
      currentStreak = streakCount;
    }

    const heatmapData = stats.map((s: any) => ({
      date: s.date.toISOString(), // Serialize date for client component
      count: s.chaptersRead
    }));

    return {
      stats: {
        totalChapters,
        daysActive,
        currentStreak,
        longestStreak
      },
      heatmap: heatmapData
    };
  } catch (e) {
    console.error(e);
    return { stats: null, heatmap: [] };
  }
}

export default async function Home() {
  const trendingComics = await getTrendingComics();
  const updates = await getUpdates();
  const recommendedComics = await getRecommendedComics();
  const { stats, heatmap } = await getReadingStats();

  // Fetch library status for current user
  const userId = 'demo_user_id';
  const libraryEntries = await (prisma as any).libraryEntry.findMany({
    where: { userId },
    include: { comic: true }
  });

  // Create a map of slug -> status
  const libraryMap = new Map();
  libraryEntries.forEach((entry: any) => {
    if (entry.comic.slug) {
      libraryMap.set(entry.comic.slug, entry.status);
    }
  });

  const mapStatus = (comic: any) => {
    return libraryMap.get(comic.id) || null;
  };

  return (
    <main className="min-h-screen bg-[#0a0c10] pb-20">
      {/* Hero Section with Carousel */}
      <HeroCarousel comics={trendingComics} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Up Next Carousel - Added top margin for separation */}
        <div className="mt-8">
          <UpNextCarousel />
        </div>

        {/* Reading Stats */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-green-500">📊</span> Reading Activity
          </h2>
          <StatsOverview stats={stats} loading={false} />
          <ReadingHeatmap data={heatmap} loading={false} />
        </div>

        {/* Recommended For You Section */}
        {recommendedComics.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-yellow-500">🎯</span> Recommended for You
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {recommendedComics.map((comic: any) => (
                <ComicCard
                  key={comic.id}
                  {...comic}
                  currentStatus={mapStatus(comic)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trending Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500">📈</span> Trending Now
            </h2>
            <Link href="/search?sort=rating" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {trendingComics.map((comic: any) => (
              <ComicCard
                key={comic.id}
                {...comic}
                currentStatus={mapStatus(comic)}
              />
            ))}
          </div>
        </section>

        {/* Updates Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-purple-500">✨</span> Updates
            </h2>
            <Link href="/search?sort=latest" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {updates.map((comic: any) => (
              <ComicCard
                key={comic.id}
                {...comic}
                currentStatus={mapStatus(comic)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
