const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyContentRating() {
    console.log('Verifying contentRating field in Post API response...');

    try {
        // 1. Fetch a post via Prisma to see if the field exists in the relation
        const post = await prisma.post.findFirst({
            include: {
                comic: {
                    select: {
                        title: true,
                        contentRating: true
                    }
                }
            }
        });

        if (post && post.comic) {
            console.log('Prisma Fetch Result:');
            console.log(`- Post ID: ${post.id}`);
            console.log(`- Comic Title: ${post.comic.title}`);
            console.log(`- Content Rating: ${post.comic.contentRating}`);
        } else {
            console.log('No posts found to verify.');
        }

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyContentRating();
