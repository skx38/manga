import { NextResponse } from 'next/server';
import { getCurrentUserIdOrDemo } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const folders = await prisma.folder.findMany({
        where: { userId },
        include: { comics: true },
        orderBy: { order: 'asc' }
    });
    return NextResponse.json(folders);
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        const userId = await getCurrentUserIdOrDemo();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const folder = await prisma.folder.create({
            data: {
                userId,
                name,
            }
        });
        return NextResponse.json(folder);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
    }
}
