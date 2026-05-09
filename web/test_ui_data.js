
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
            comicId: 'test-ui-comic',
            comicTitle: 'Test UI Comic',
            coverImageUrl: 'http://example.com/ui-cover.png',
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
            title: 'Test UI Post',
            content: 'Testing UI data.',
            comicId: 'test-ui-comic',
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
            content: 'Test comment',
            postId,
            userId: 'demo_user_id'
        }));
        const commentId = commentRes.body.id;

        console.log('4. Voting on Comment...');
        await request({
            hostname: 'localhost', port: 3000, path: '/api/comments/vote', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            commentId,
            userId: 'demo_user_id',
            value: 1
        }));

        console.log('5. Fetching Post Details...');
        const postRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/community/posts?id=${postId}`, method: 'GET'
        });

        if (postRes.body.comic && postRes.body.comic.coverImageUrl === 'http://example.com/ui-cover.png') {
            console.log('SUCCESS: Post has comic cover image.');
        } else {
            console.error('FAILURE: Post missing comic cover image.');
        }

        console.log('6. Fetching Comments...');
        const commentsRes = await request({
            hostname: 'localhost', port: 3000, path: `/api/comments?postId=${postId}`, method: 'GET'
        });

        const comment = commentsRes.body.find(c => c.id === commentId);
        if (comment && comment.score === 1) {
            console.log('SUCCESS: Comment has correct score.');
        } else {
            console.error('FAILURE: Comment score incorrect.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
