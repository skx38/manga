
const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function main() {
    try {
        console.log('1. Creating Post...');
        const postData = JSON.stringify({
            title: 'Test Post Flow',
            content: 'This is the content of the test post.',
            comicId: 'test-comic-id', // We might need a valid comic ID or ensure this doesn't fail FK
            userId: 'demo_user_id',
            flair: 'Discussion'
        });

        // We need to ensure the comic exists first, or use a known one.
        // The API upserts the comic if we provide comicTitle, but the POST /api/community/posts 
        // DOES NOT seem to upsert the comic based on my reading of route.ts.
        // Let's check route.ts again. 
        // It does NOT upsert comic. It expects comicId to exist.
        // So we should use a comicId that likely exists or create one.
        // 'test-comic-id' was deleted.
        // I'll try to use 'general' if that's allowed, or I need to create a comic first.
        // Actually, let's just try to create a post with 'general' comicId if the schema allows it?
        // Schema says `comicId String` and relation to `Comic`. So it must exist.
        // I will use the `test_review_http.js` logic to upsert a comic via the review API first?
        // Or just insert it directly via Prisma if I can.

        // Let's just use the review API to create the comic first as a hack/setup.
        console.log('0. Setting up Comic...');
        await request({
            hostname: 'localhost', port: 3000, path: '/api/reviews', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            comicId: 'test-post-comic',
            comicTitle: 'Test Post Comic',
            coverImageUrl: 'http://example.com/cover.png',
            comicType: 'manga',
            userId: 'demo_user_id',
            recommend: true,
            comment: 'Setup comic'
        }));

        const createRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/community/posts', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            title: 'Test Post Flow',
            content: 'This is the content of the test post.',
            comicId: 'test-post-comic',
            userId: 'demo_user_id',
            flair: 'Discussion'
        }));

        console.log('Create Status:', createRes.status);
        if (createRes.status !== 201) {
            console.error('Failed to create post:', createRes.body);
            return;
        }

        const postId = createRes.body.id;
        console.log('Post Created ID:', postId);

        console.log('2. Fetching Post...');
        const fetchRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/community/posts?id=${postId}`, method: 'GET'
        });

        console.log('Fetch Status:', fetchRes.status);
        console.log('Fetch Body:', fetchRes.body);

        if (fetchRes.body.content === 'This is the content of the test post.') {
            console.log('SUCCESS: Content matches!');
        } else {
            console.error('FAILURE: Content mismatch or missing.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
