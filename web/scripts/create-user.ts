import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating user-1...');

    const user = await prisma.user.upsert({
        where: { id: 'user-1' },
        update: {},
        create: {
            id: 'user-1',
            username: 'demo_user',
            email: 'demo@omniread.com',
        }
    });

    console.log('User created:', user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
