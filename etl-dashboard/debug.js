// Run this script to verify if your API key is configured correctly
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Read the env file
try {
  console.log('Reading .env.local file...');
  const envFile = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envFile, 'utf8');
  
  // Parse the API URL and key
  const apiUrlMatch = envContent.match(/NEXT_PUBLIC_API_BASE_URL=(.+?)(\s|$)/);
  const apiKeyMatch = envContent.match(/NEXT_PUBLIC_API_KEY=(.+?)(\s|$)/);
  
  const apiUrl = apiUrlMatch ? apiUrlMatch[1].trim() : null;
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;
  
  console.log('API URL:', apiUrl);
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}` : 'Not found');
  console.log('API Key char codes:', apiKey ? Array.from(apiKey).map(c => c.charCodeAt(0)) : 'N/A');
  
  // Test the API connection
  if (apiUrl && apiKey) {
    console.log(`Testing connection to ${apiUrl}/health...`);
    
    const protocol = apiUrl.startsWith('https') ? https : http;
    const url = new URL('/health', apiUrl);
    
    const req = protocol.request(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      console.log(`Status code: ${res.statusCode}`);
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', data);
        if (res.statusCode === 401) {
          console.log('\nAuthentication failed. Make sure your API key matches the one in the backend.');
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('\nConnection successful! Authentication is working.');
        } else {
          console.log('\nConnection failed. Backend may not be running or there might be other issues.');
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error:', error.message);
      console.log('\nFailed to connect. Make sure the backend server is running at', apiUrl);
    });
    
    req.end();
  }
} catch (error) {
  console.error('Error:', error.message);
} 