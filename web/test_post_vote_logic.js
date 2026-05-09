
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
        // Reuse existing comic or create new if needed. Let's try creating new to be safe.
        await request({
            hostname: 'localhost', port: 3000, path: '/api/reviews', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            comicId: 'test-post-vote-logic-comic',
            comicTitle: 'Test Post Vote Logic Comic',
            coverImageUrl: 'http://example.com/cover.png',
            comicType: 'manga',
            userId: 'demo_user_id',
            recommend: true,
            comment: 'Setup'
        }));

        const createRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/community/posts', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            title: 'Test Post Vote Logic Post',
            content: 'Testing vote logic.',
            comicId: 'test-post-vote-logic-comic',
            userId: 'demo_user_id',
            flair: 'Discussion'
        }));
        const postId = createRes.body.id;
        console.log('Post ID:', postId);

        console.log('2. Voting +1...');
        await request({
            hostname: 'localhost', port: 3000, path: '/api/community/posts/vote', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            postId,
            userId: 'demo_user_id',
            value: 1
        }));

        console.log('3. Fetching Post (Expect userVote: 1)...');
        const res1 = await request({
            hostname: 'localhost', port: 3000, path: `/api/community/posts?id=${postId}`, method: 'GET'
        });
        console.log(`Score: ${res1.body.score}, UserVote: ${res1.body.userVote}`);
        if (res1.body.userVote !== 1) console.error('FAILURE: userVote should be 1');

        console.log('4. Voting +1 again (Toggle off)...');
        await request({
            hostname: 'localhost', port: 3000, path: '/api/community/posts/vote', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            postId,
            userId: 'demo_user_id',
            value: 1
        }));

        console.log('5. Fetching Post (Expect userVote: 0)...');
        const res2 = await request({
            hostname: 'localhost', port: 3000, path: `/api/community/posts?id=${postId}`, method: 'GET'
        });
        console.log(`Score: ${res2.body.score}, UserVote: ${res2.body.userVote}`);
        if (res2.body.userVote !== 0) console.error('FAILURE: userVote should be 0');

        console.log('6. Voting -1...');
        await request({
            hostname: 'localhost', port: 3000, path: '/api/community/posts/vote', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            postId,
            userId: 'demo_user_id',
            value: -1
        }));

        console.log('7. Fetching Post (Expect userVote: -1)...');
        const res3 = await request({
            hostname: 'localhost', port: 3000, path: `/api/community/posts?id=${postId}`, method: 'GET'
        });
        console.log(`Score: ${res3.body.score}, UserVote: ${res3.body.userVote}`);
        if (res3.body.userVote !== -1) console.error('FAILURE: userVote should be -1');

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
