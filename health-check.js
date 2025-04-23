/**
 * Direct Health Check Tool
 * This script directly tests the backend health endpoint
 */
const http = require('http');

// Configuration
const PORT = 3000;
const API_KEY = process.env.API_KEY || 'serverless-etl-dev-key';

// Testing multiple endpoints
const endpoints = [
  { path: '/health', name: 'Health Check' },
  { path: '/metrics', name: 'Metrics', auth: true },
  { path: '/', name: 'Root' }
];

console.log('🔍 Direct Health Check Tool');
console.log(`Testing backend on port ${PORT} with API key: ${API_KEY.substring(0, 4)}...`);

// Test each endpoint
async function testEndpoints() {
  for (const endpoint of endpoints) {
    const url = `http://localhost:${PORT}${endpoint.path}`;
    console.log(`\nTesting ${endpoint.name} endpoint: ${url}`);
    
    try {
      await new Promise((resolve) => {
        const headers = {};
        
        // Add authentication for protected endpoints
        if (endpoint.auth) {
          headers['X-API-Key'] = API_KEY;
          console.log('Using authentication');
        }
        
        const request = http.get(url, { headers }, (response) => {
          console.log(`Status code: ${response.statusCode}`);
          console.log(`Status message: ${response.statusMessage}`);
          
          let data = '';
          response.on('data', (chunk) => {
            data += chunk;
          });
          
          response.on('end', () => {
            if (data) {
              try {
                const json = JSON.parse(data);
                console.log('Response:', JSON.stringify(json, null, 2));
              } catch (e) {
                console.log('Response (not JSON):', data.substring(0, 200));
                if (data.length > 200) {
                  console.log(`... (${data.length - 200} more characters)`);
                }
              }
            } else {
              console.log('No response data');
            }
            resolve();
          });
        });
        
        request.on('error', (error) => {
          console.error(`Error: ${error.message}`);
          resolve();
        });
        
        request.setTimeout(3000, () => {
          request.abort();
          console.log('Request timed out after 3 seconds');
          resolve();
        });
      });
    } catch (error) {
      console.error(`Error testing ${endpoint.path}:`, error.message);
    }
  }
}

// Run test
testEndpoints().then(() => {
  console.log('\n✅ Health check tests completed');
}); 