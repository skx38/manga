const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking DB for comics...');
    const count = await prisma.comic.count();
    console.log(`Total Comics in DB: ${count}`);

    if (count > 0) {
        const comics = await prisma.comic.findMany({ take: 3 });
        console.log('First 3 comics:', JSON.stringify(comics, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
