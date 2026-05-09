
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
        console.log('1. Setting up Comic...');
        await request({
            hostname: 'localhost', port: 3000, path: '/api/reviews', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            comicId: 'test-vote-comic',
            comicTitle: 'Test Vote Comic',
            coverImageUrl: 'http://example.com/vote-cover.png',
            comicType: 'manga',
            userId: 'demo_user_id',
            recommend: true,
            comment: 'Setup comic'
        }));

        console.log('2. Creating Post...');
        const createRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/community/posts', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            title: 'Test Vote Post',
            content: 'Testing vote logic.',
            comicId: 'test-vote-comic',
            userId: 'demo_user_id',
            flair: 'Discussion'
        }));

        const postId = createRes.body.id;
        console.log('Post ID:', postId);

        console.log('3. Creating Comment...');
        const commentRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/comments', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            content: 'Test vote comment',
            postId,
            userId: 'demo_user_id'
        }));
        const commentId = commentRes.body.id;

        console.log('4. Voting +1...');
        await request({
            hostname: 'localhost', port: 3000, path: '/api/comments/vote', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            commentId,
            userId: 'demo_user_id',
            value: 1
        }));

        console.log('5. Fetching Comments (Expect userVote: 1)...');
        const res1 = await request({
            hostname: 'localhost', port: 3000, path: `/api/comments?postId=${postId}`, method: 'GET'
        });
        const comment1 = res1.body.find(c => c.id === commentId);
        console.log(`Score: ${comment1.score}, UserVote: ${comment1.userVote}`);
        if (comment1.userVote !== 1) console.error('FAILURE: userVote should be 1');

        console.log('6. Voting +1 again (Toggle off)...');
        await request({
            hostname: 'localhost', port: 3000, path: '/api/comments/vote', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            commentId,
            userId: 'demo_user_id',
            value: 1
        }));

        console.log('7. Fetching Comments (Expect userVote: 0)...');
        const res2 = await request({
            hostname: 'localhost', port: 3000, path: `/api/comments?postId=${postId}`, method: 'GET'
        });
        const comment2 = res2.body.find(c => c.id === commentId);
        console.log(`Score: ${comment2.score}, UserVote: ${comment2.userVote}`);
        if (comment2.userVote !== 0) console.error('FAILURE: userVote should be 0');

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
