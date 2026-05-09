import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const userId = 'demo_user_id';
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
        const userId = 'demo_user_id';

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
