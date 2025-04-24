/**
 * Script to fix port configuration for both frontend and backend
 */
const fs = require('fs');
const path = require('path');

console.log('Configuring ports for development...');

// Update the .env.local file for the frontend
const envPath = path.join(__dirname, 'etl-dashboard-backup', 'etl-dashboard', '.env.local');
const envContent = `# Base URL for the backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# API Key for backend authentication
NEXT_PUBLIC_API_KEY=serverless-etl-dashboard-key-2024
`;

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Updated frontend .env.local file to use backend on port 3000');
} catch (error) {
  console.error('❌ Failed to update frontend .env.local file:', error.message);
  console.log('  Attempting to create via command line...');
  
  try {
    // Alternate approach using individual lines
    fs.writeFileSync(envPath, '# Base URL for the backend API\n', 'utf8');
    fs.appendFileSync(envPath, 'NEXT_PUBLIC_API_BASE_URL=http://localhost:3000\n\n', 'utf8');
    fs.appendFileSync(envPath, '# API Key for backend authentication\n', 'utf8');
    fs.appendFileSync(envPath, 'NEXT_PUBLIC_API_KEY=serverless-etl-dashboard-key-2024\n', 'utf8');
    console.log('✅ Successfully created .env.local file with alternate method');
  } catch (innerError) {
    console.error('❌ All attempts to create .env.local failed:', innerError.message);
  }
}

// Update CORS configuration in backend to accept requests from frontend on port 3001
const appJsPath = path.join(__dirname, 'src', 'app.js');
if (fs.existsSync(appJsPath)) {
  try {
    const appJsContent = fs.readFileSync(appJsPath, 'utf8');
    const updatedAppJsContent = appJsContent.replace(
      /origin:.*(\['http:\/\/localhost:3000'.*\])/,
      `origin: config.get('cors.origins') || ['http://localhost:3001', 'http://127.0.0.1:3001']`
    );
    
    fs.writeFileSync(appJsPath, updatedAppJsContent);
    console.log('✅ Updated CORS configuration in src/app.js');
  } catch (error) {
    console.error('❌ Failed to update src/app.js:', error.message);
  }
}

// Update CORS in server.js as well
const serverJsPath = path.join(__dirname, 'src', 'server.js');
if (fs.existsSync(serverJsPath)) {
  try {
    const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
    const updatedServerJsContent = serverJsContent.replace(
      /origin:.*(\['http:\/\/localhost:3001'.*\])/,
      `origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3001', 'https://localhost:3001']`
    );
    
    fs.writeFileSync(serverJsPath, updatedServerJsContent);
    console.log('✅ Updated CORS configuration in src/server.js');
  } catch (error) {
    console.error('❌ Failed to update src/server.js:', error.message);
  }
}

console.log('\n🔄 Port configuration complete! You can now:');
console.log('- Run backend on port 3000: npm run start');
console.log('- Run frontend on port 3001: cd etl-dashboard-backup/etl-dashboard && npm run dev');
console.log('\nOr use the convenience script to run both:');
console.log('npm run dev:all'); 