/**
 * ETL Services Integration Setup
 * 
 * This script helps set up the integration between the frontend and backend components
 * of the Serverless ETL Services application.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const rootDir = __dirname;
const backendDir = path.join(rootDir);
const frontendDir = path.join(rootDir, 'etl-dashboard-backup/etl-dashboard');
const configFile = path.join(frontendDir, '.env.local');

// Get the backend API key from environment or generate a default one
const apiKey = process.env.API_KEY || 'serverless-etl-dev-key';

// Create frontend env file
function createEnvFile() {
  const envContent = `# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_KEY=${apiKey}
`;

  try {
    fs.writeFileSync(configFile, envContent);
    console.log('✅ Created frontend .env.local file with API configuration');
  } catch (error) {
    console.error('❌ Failed to create .env.local file:', error.message);
  }
}

// Update backend configuration to use same API key
function updateBackendConfig() {
  try {
    // Set environment variable for backend
    process.env.API_KEY = apiKey;
    console.log(`✅ Backend API key configured: ${apiKey}`);
  } catch (error) {
    console.error('❌ Failed to update backend configuration:', error.message);
  }
}

// Check for required dependencies
function checkDependencies() {
  try {
    console.log('📦 Checking NPM packages...');
    execSync('npm list concurrently', { stdio: 'ignore' });
  } catch (error) {
    console.log('Installing concurrently package for running both servers...');
    execSync('npm install --save-dev concurrently', { stdio: 'inherit' });
  }
}

// Update package.json with integration scripts
function updatePackageJson() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = {
      ...packageJson.scripts,
      'dev:backend': 'node src/server.js',
      'dev:frontend': 'cd etl-dashboard-backup/etl-dashboard && npm run dev',
      'dev': 'concurrently "npm run dev:backend" "npm run dev:frontend"',
      'setup': 'node integration-setup.js'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with integration scripts');
  } catch (error) {
    console.error('❌ Failed to update package.json:', error.message);
  }
}

// Main function
function main() {
  console.log('🚀 Setting up ETL Services Integration...');
  
  createEnvFile();
  updateBackendConfig();
  checkDependencies();
  updatePackageJson();
  
  console.log(`
🎉 Integration setup complete!

To run both frontend and backend together:
  npm run dev

To run them separately:
  npm run dev:backend    # Backend server on http://localhost:3001
  npm run dev:frontend   # Frontend on http://localhost:3000

The frontend is configured to connect to the backend at http://localhost:3001
using the API key: ${apiKey}
`);
}

// Run the setup
main(); 