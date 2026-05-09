const https = require('https');

const query = `
query ($username: String) {
    MediaListCollection(userName: $username, type: MANGA) {
        lists {
            entries {
                status
                media {
                    title {
                        english
                    }
                }
            }
        }
    }
}
`;

const data = JSON.stringify({
    query,
    variables: { username: 'sulekillx' } // Trying the user's name on Anilist just in case
});

const options = {
    hostname: 'graphql.anilist.co',
    path: '/',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'User-Agent': 'OmniRead/1.0'
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
            const json = JSON.parse(body);
            if (json.errors) {
                console.log('Errors:', JSON.stringify(json.errors, null, 2));
            } else {
                const lists = json.data.MediaListCollection.lists;
                const count = lists.reduce((acc, list) => acc + list.entries.length, 0);
                console.log(`Success! Found ${count} entries.`);
            }
        } catch (e) {
            console.log('Failed to parse JSON');
        }
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
});

req.write(data);
req.end();
