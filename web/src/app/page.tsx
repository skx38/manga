import ComicCard from '@/components/ComicCard';
import UpNextCarousel from '@/components/dashboard/UpNextCarousel';
import { PrismaClient } from '@prisma/client';
import StatsOverview from '@/components/dashboard/StatsOverview';
import ReadingHeatmap from '@/components/dashboard/ReadingHeatmap';
import { startOfDay, subDays, differenceInDays, isSameDay } from 'date-fns';
import { Flame, Sparkles, Clock, BarChart3 } from 'lucide-react';
import HeroCarousel from '@/components/dashboard/HeroCarousel';
import { getPersonalizedRecommendations } from '@/lib/recommendations';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { SectionHeader } from '@/components/shared/SectionHeader';

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

async function getRecommendedComics(userId: string | null) {
  if (!userId) return [];
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

async function getReadingStats(userId: string | null) {
  if (!userId) return { stats: null, heatmap: [] };
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
  const userId = await getCurrentUserIdOrDemo();
  const trendingComics = await getTrendingComics();
  const updates = await getUpdates();
  const recommendedComics = await getRecommendedComics(userId);
  const { stats, heatmap } = await getReadingStats(userId);

  // Fetch library status for current user
  const libraryEntries = userId
    ? await (prisma as any).libraryEntry.findMany({
        where: { userId },
        include: { comic: true },
      })
    : [];

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

  const CARD_GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4';

  return (
    <main className="min-h-screen pb-20">
      <HeroCarousel comics={trendingComics} />

      <div className="container mx-auto px-4 pt-8 space-y-12">
        {/* Continue reading */}
        <section>
          <UpNextCarousel />
        </section>

        {/* Reading Stats (only when signed in / demo user) */}
        {userId && (stats || heatmap.length > 0) && (
          <section>
            <SectionHeader title="Reading Activity" icon={BarChart3} />
            <StatsOverview stats={stats} loading={false} />
            <ReadingHeatmap data={heatmap} loading={false} />
          </section>
        )}

        {/* Recommended */}
        {recommendedComics.length > 0 && (
          <section>
            <SectionHeader title="Recommended for You" icon={Sparkles} />
            <div className={CARD_GRID}>
              {recommendedComics.map((comic: any) => (
                <ComicCard key={comic.id} {...comic} currentStatus={mapStatus(comic)} />
              ))}
            </div>
          </section>
        )}

        {/* Trending */}
        <section>
          <SectionHeader title="Trending Now" icon={Flame} href="/search?sort=popular" />
          <div className={CARD_GRID}>
            {trendingComics.map((comic: any) => (
              <ComicCard key={comic.id} {...comic} currentStatus={mapStatus(comic)} />
            ))}
          </div>
        </section>

        {/* Latest Updates */}
        <section>
          <SectionHeader title="Latest Updates" icon={Clock} href="/search?sort=latest" />
          <div className={CARD_GRID}>
            {updates.map((comic: any) => (
              <ComicCard key={comic.id} {...comic} currentStatus={mapStatus(comic)} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
