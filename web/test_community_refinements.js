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
    console.log('--- Testing Community Refinements ---');

    // 1. Test Top Sort with Time
    console.log('\n1. Testing Top Sort (Time Filter)');
    const topAll = await request('/api/community/posts?sort=top&time=all');
    console.log(`Top (All Time): ${topAll.length} posts`);

    const topDay = await request('/api/community/posts?sort=top&time=day');
    console.log(`Top (Today): ${topDay.length} posts`);

    // 2. Test Post Creation (Simulating Modal)
    console.log('\n2. Testing Post Creation');
    // First get a comic ID
    const comics = await request('/api/comics?search=solo&limit=1');
    console.log('Comics Response Type:', typeof comics);
    console.log('Comics Response IsArray:', Array.isArray(comics));
    console.log('Comics Response Length:', comics.length);
    if (Array.isArray(comics) && comics.length > 0) {
        const comicId = comics[0].id;
        console.log(`Using comic: ${comics[0].title} (${comicId})`);

        const newPost = await request('/api/community/posts', 'POST', {
            title: 'Test Post via Script',
            content: 'Testing the API directly.',
            comicId: comicId,
            userId: 'demo_user_id'
        });
        console.log('Created Post:', newPost.id ? 'Success' : 'Failed', newPost.id || newPost);
    } else {
        console.log('Skipping post creation (no comics found)');
    }
}

test();
