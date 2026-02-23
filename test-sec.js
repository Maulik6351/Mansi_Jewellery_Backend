const http = require('http');
const fs = require('fs');
const path = require('path');

// Helper for making requests
const makeRequest = (options, data = null) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(data);
        }
        req.end();
    });
};

const run = async () => {
    console.log('--- Security & Validation Verification ---');

    // 1. Test Public Route Access
    console.log('Testing Public Route (GET /api/products)...');
    try {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/products',
            method: 'GET'
        });
        console.log(`Public Route Status: ${res.statusCode} (Expected 200)`);
    } catch (e) {
        console.error('Failed to fetch public route:', e.message);
    }

    // 2. Test Admin Route Without Auth
    console.log('\nTesting Admin Route Without Auth (POST /api/products/admin)...');
    try {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/products/admin',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({ name: 'Test' }));
        console.log(`Admin Route Status: ${res.statusCode} (Expected 401/403)`);
    } catch (e) {
        console.error('Failed to access admin route:', e.message);
    }

    console.log('------------------------------------------');
};

run();
