import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BookOpen, Shield, ArrowLeft } from 'lucide-react';
import { PrismaClient } from '@prisma/client';
import CommunityFeed from '@/components/community/CommunityFeed';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

async function getData(slug: string) {
    const comic = await prisma.comic.findUnique({
        where: { slug },
        select: {
            id: true,
            title: true,
            slug: true,
            coverImageUrl: true,
            description: true,
            communityRules: true,
            _count: { select: { posts: true } },
        },
    });
    return comic;
}

export default async function CommunityComicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const comic = await getData(slug);
    if (!comic) notFound();

    const rules = Array.isArray(comic.communityRules) ? (comic.communityRules as string[]) : [];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Banner */}
            <div className="relative h-48 w-full overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent z-10" />
                {comic.coverImageUrl && (
                    <Image
                        src={comic.coverImageUrl}
                        alt={comic.title}
                        fill
                        className="object-cover opacity-30 blur-sm"
                        sizes="100vw"
                        priority
                    />
                )}
                <div className="absolute bottom-6 left-0 right-0 z-20 container mx-auto px-4 flex items-end gap-4">
                    <div className="w-20 h-28 relative rounded-lg shadow-xl border border-border overflow-hidden flex-shrink-0">
                        <Image
                            src={comic.coverImageUrl || '/placeholder-cover.svg'}
                            alt={comic.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                        />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">c/{comic.title}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {comic._count.posts} {comic._count.posts === 1 ? 'post' : 'posts'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                {/* Feed */}
                <main className="min-w-0">
                    <CommunityFeed comicId={comic.id} />
                </main>

                {/* Sidebar */}
                <aside className="space-y-4">
                    <Link
                        href={`/comic/${comic.slug}`}
                        className="flex items-center gap-2 text-sm text-brand hover:underline"
                    >
                        <ArrowLeft size={14} />
                        Back to series
                    </Link>

                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen size={16} className="text-muted-foreground" />
                            <h2 className="font-semibold text-sm">About</h2>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-6">
                            {comic.description || 'No description available.'}
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield size={16} className="text-muted-foreground" />
                            <h2 className="font-semibold text-sm">Community Rules</h2>
                        </div>
                        {rules.length > 0 ? (
                            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                {rules.map((rule, i) => (
                                    <li key={i}>{rule}</li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                No rules set yet. Be civil — discuss spoilers behind <code className="text-xs">&gt;!tags!&lt;</code>.
                            </p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
