import { ingestMangaChapters } from './ingest-manga';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find Solo Leveling in the database
    const soloLeveling = await prisma.comic.findFirst({
        where: { title: 'Solo Leveling' }
    });

    if (!soloLeveling) {
        console.error('Solo Leveling not found in database');
        return;
    }

    console.log(`Found Solo Leveling (ID: ${soloLeveling.id})`);
    console.log(`Ingesting first 3 chapters from Comick...`);

    await ingestMangaChapters({
        mangaId: soloLeveling.id,
        externalId: 'solo-leveling',  // Comick slug
        source: 'comick',
        chapters: [1, 2, 3],  // Just first 3 chapters for testing
    });
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
