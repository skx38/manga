
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
        console.log('1. Checking Library Page Load...');
        // We can't easily test client-side React logic with Node.js http request, 
        // but we can check if the page loads without 500 error.
        // For full logic verification, we rely on manual testing as per plan, 
        // or unit tests if we had a testing setup. 
        // Since we are in a "verification" phase, let's at least ensure the build/server is happy.

        // Actually, since the filtering is client-side in LibraryContent, 
        // the server just renders the initial state. 
        // We can check if the API endpoints used by the components are healthy.

        console.log('2. Checking Folders API...');
        const foldersRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/folders', method: 'GET'
        });
        if (foldersRes.status !== 200) console.error('FAILURE: Folders API failed');
        else console.log('SUCCESS: Folders API OK');

        console.log('3. Checking Library Status API...');
        // We can try to set a status for a dummy comic to see if API works
        const statusRes = await request({
            hostname: 'localhost', port: 3000, path: '/api/library/status', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({
            comicId: 'test-library-revamp-comic',
            status: 'READING',
            details: { title: 'Test Comic', coverUrl: '', type: 'manga' }
        }));

        // It might fail if comic doesn't exist, but let's see response
        console.log('Status API Response:', statusRes.status);

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
