import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const folderId = id;
        const { isPublic } = await request.json();

        const folder = await prisma.folder.update({
            where: { id: folderId },
            data: { isPublic }
        });

        return NextResponse.json(folder);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update folder sharing' }, { status: 500 });
    }
}
