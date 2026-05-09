const http = require('http');

function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    console.log('--- Testing Post Creation ---');

    // 1. Get a comic ID
    const comics = await request('/api/comics?search=solo&limit=1');
    if (!Array.isArray(comics) || comics.length === 0) {
        console.error('No comics found for test.');
        return;
    }
    const comicId = comics[0].id;
    console.log(`Using comic: ${comics[0].title} (${comicId})`);

    // 2. Test Post with Content
    console.log('\n2. Testing Post WITH Content');
    const postWithContent = await request('/api/community/posts', 'POST', {
        title: 'Test Post With Content',
        content: 'This is some content.',
        comicId: comicId,
        userId: 'demo_user_id'
    });
    console.log('Post with content created:', postWithContent.id ? 'Success' : 'Failed', postWithContent.id || postWithContent);

    // 3. Test Post WITHOUT Content (Should now succeed)
    console.log('\n3. Testing Post WITHOUT Content');
    const postWithoutContent = await request('/api/community/posts', 'POST', {
        title: 'Test Post Without Content',
        // content is omitted
        comicId: comicId,
        userId: 'demo_user_id'
    });
    console.log('Post without content created:', postWithoutContent.id ? 'Success' : 'Failed');
    if (!postWithoutContent.id) console.log('Error:', JSON.stringify(postWithoutContent));
}

test();
