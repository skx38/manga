
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
        const createRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/community/posts', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            title: 'Test Vote API Post',
            content: 'Testing vote API.',
            comicId: 'test-vote-api-comic', // Will fail if comic doesn't exist, but let's try reusing or just ignore comic check if API is loose
            userId: 'demo_user_id',
            flair: 'Discussion'
        }));

        // If comic check fails, we might need to create comic first. 
        // But let's see if we can just check an existing post if create fails.
        let postId = createRes.body.id;

        if (!postId) {
            // Create comic first
            console.log('Creating comic first...');
            await request({
                hostname: 'localhost', port: 3000, path: '/api/reviews', method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, JSON.stringify({
                comicId: 'test-vote-api-comic',
                comicTitle: 'Test Vote API Comic',
                coverImageUrl: 'http://example.com/cover.png',
                comicType: 'manga',
                userId: 'demo_user_id',
                recommend: true,
                comment: 'Setup'
            }));

            const createRes2 = await request({
                hostname: 'localhost', port: 3000, path: '/api/community/posts', method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, JSON.stringify({
                title: 'Test Vote API Post',
                content: 'Testing vote API.',
                comicId: 'test-vote-api-comic',
                userId: 'demo_user_id',
                flair: 'Discussion'
            }));
            postId = createRes2.body.id;
        }

        console.log('Post ID:', postId);

        console.log('2. Voting +1 on Post...');
        await request({
            hostname: 'localhost', port: 3000, path: '/api/community/posts/vote', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            postId,
            userId: 'demo_user_id',
            value: 1
        }));

        console.log('3. Fetching Post (Expect userVote: 1)...');
        const res = await request({
            hostname: 'localhost', port: 3000, path: `/api/community/posts?id=${postId}`, method: 'GET'
        });

        console.log(`Score: ${res.body.score}, UserVote: ${res.body.userVote}`);
        if (res.body.userVote !== 1) console.error('FAILURE: userVote should be 1');
        else console.log('SUCCESS: userVote is 1');

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
