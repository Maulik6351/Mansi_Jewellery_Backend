const https = require('http');

const output = (label, time) => {
    console.log(`${label}: ${time.toFixed(2)}ms`);
};

const makeRequest = (url) => {
    return new Promise((resolve, reject) => {
        const start = performance.now();
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const end = performance.now();
                resolve({ time: end - start, status: res.statusCode });
            });
        });
        req.on('error', reject);
    });
};

const run = async () => {
    console.log('--- Performance Verification ---');
    const apiUrl = 'http://localhost:3000/api/products?limit=12';

    // Warmup / First Request (Cache Miss)
    console.log(`Fetching ${apiUrl} (Expect Cache Miss)...`);
    const r1 = await makeRequest(apiUrl);
    output('First Load', r1.time);

    // Second Request (Expect Cache Hit)
    console.log(`Fetching ${apiUrl} (Expect Cache Hit)...`);
    const r2 = await makeRequest(apiUrl);
    output('Second Load', r2.time);

    if (r2.time < r1.time) {
        console.log('✅ Cache is working! (Second load was faster)');
    } else {
        console.log('⚠️ Cache might not be working or unexpected latency.');
    }

    console.log('\n--- Static File Verification ---');
    const staticUrl = 'http://localhost:3000/uploads/test.txt';
    console.log(`Fetching ${staticUrl}...`);
    const r3 = await makeRequest(staticUrl);
    if (r3.status === 200) {
        console.log('✅ Static file serving is working!');
    } else {
        console.log(`❌ Static file serving failed with status ${r3.status}`);
    }

    console.log('--------------------------------');
};

run();
