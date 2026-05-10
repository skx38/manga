import { notFound, redirect } from 'next/navigation';
import { Shield } from 'lucide-react';
import { PrismaClient } from '@prisma/client';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { isCommunityMod } from '@/lib/permissions';
import ModQueue from './ModQueue';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function ModQueuePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const userId = await getCurrentUserIdOrDemo();
    if (!userId) redirect(`/api/auth/signin?callbackUrl=/c/${slug}/mod`);

    const comic = await prisma.comic.findUnique({
        where: { slug },
        select: { id: true, title: true },
    });
    if (!comic) notFound();

    const allowed = await isCommunityMod(userId, comic.id);
    if (!allowed) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <Shield size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-xl font-bold mb-2">Mods only</h1>
                    <p className="text-sm text-muted-foreground">
                        You don&apos;t moderate c/{comic.title}. Contact an existing mod if you think this is a mistake.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <header className="mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Shield className="text-warning" size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Mod queue</h1>
                        <p className="text-sm text-muted-foreground">c/{comic.title}</p>
                    </div>
                </header>

                <ModQueue comicId={comic.id} />
            </div>
        </div>
    );
}
