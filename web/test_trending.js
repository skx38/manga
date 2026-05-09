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
    console.log('--- Testing Trending Communities ---');

    // 1. Fetch Trending
    console.log('\nFetching trending communities...');
    const trending = await request('/api/community/trending');

    if (Array.isArray(trending)) {
        console.log(`Found ${trending.length} trending communities.`);
        trending.forEach((c, i) => {
            console.log(`${i + 1}. ${c.title} (${c.postCount} posts)`);
        });

        // Basic validation
        if (trending.length > 0) {
            const first = trending[0];
            if (first.postCount === undefined) {
                console.error('FAIL: postCount missing');
            } else {
                console.log('PASS: Structure looks correct');
            }
        }
    } else {
        console.error('FAIL: Expected array, got:', trending);
    }
}

test();
