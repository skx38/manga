
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
            comicId: 'test-interaction-comic',
            comicTitle: 'Test Interaction Comic',
            coverImageUrl: 'http://example.com/cover.png',
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
            title: 'Test Interaction Post',
            content: 'Testing votes and replies.',
            comicId: 'test-interaction-comic',
            userId: 'demo_user_id',
            flair: 'Discussion'
        }));

        const postId = createRes.body.id;
        console.log('Post ID:', postId);

        console.log('3. Voting on Post...');
        const voteRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/community/posts/vote', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            postId,
            userId: 'demo_user_id',
            value: 1
        }));
        console.log('Vote Score:', voteRes.body.score);

        if (voteRes.body.score !== 1) {
            console.error('Vote failed!');
        }

        console.log('4. Creating Comment...');
        const commentRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/comments', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            content: 'Root comment',
            postId,
            userId: 'demo_user_id'
        }));
        const commentId = commentRes.body.id;
        console.log('Comment ID:', commentId);

        console.log('5. Replying to Comment...');
        const replyRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/comments', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            content: 'Nested reply',
            postId,
            userId: 'demo_user_id',
            parentId: commentId
        }));
        console.log('Reply ID:', replyRes.body.id);

        console.log('6. Verifying Reply...');
        const fetchCommentsRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/comments?postId=${postId}`, method: 'GET'
        });

        const rootComment = fetchCommentsRes.body.find(c => c.id === commentId);
        if (rootComment && rootComment.replies && rootComment.replies.length > 0) {
            console.log('SUCCESS: Reply found nested under root comment.');
        } else {
            console.error('FAILURE: Reply not found.');
            console.log('Comments:', JSON.stringify(fetchCommentsRes.body, null, 2));
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
