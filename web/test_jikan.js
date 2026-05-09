const https = require('https');

function checkEndpoint(path) {
    const options = {
        hostname: 'myanimelist.net',
        path: path,
        method: 'GET',
        headers: { 'User-Agent': 'OmniRead/1.0' }
    };

    const req = https.request(options, (res) => {
        console.log(`Path: ${path} -> Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    console.log(`Success! Found ${data.data ? data.data.length : 0} entries.`);
                } catch (e) {
                    console.log('Failed to parse JSON');
                }
            });
        }
    });

    req.on('error', (e) => {
        console.error(`Error for ${path}: ${e.message}`);
    });

    req.end();
}

console.log('Testing MAL XML endpoint for user "xinil"...');
checkEndpoint('/malappinfo.php?u=xinil&status=all&type=manga'); // Legacy XML endpoint
