/**
 * Authentication Fix Script for ETL Services
 * 
 * This script helps diagnose and fix authentication issues between the frontend and backend.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const http = require('http');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Paths
const rootDir = __dirname;
const backendEnvPath = path.join(rootDir, '.env');
const frontendDir = path.join(rootDir, 'etl-dashboard-backup/etl-dashboard');
const frontendEnvPath = path.join(frontendDir, '.env.local');

// Get current API keys
function getCurrentConfig() {
  console.log('📊 Current Configuration:');
  
  // Backend
  let backendApiKey = process.env.API_KEY || 'Not set in environment';
  try {
    if (fs.existsSync(backendEnvPath)) {
      const backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
      const match = backendEnvContent.match(/API_KEY=(.+)/);
      if (match && match[1]) {
        backendApiKey = match[1];
      }
    }
  } catch (error) {
    console.error('Error reading backend .env:', error.message);
  }
  
  // Frontend
  let frontendApiKey = 'Not found';
  let frontendApiBaseUrl = 'Not found';
  try {
    if (fs.existsSync(frontendEnvPath)) {
      const frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');
      const keyMatch = frontendEnvContent.match(/NEXT_PUBLIC_API_KEY=(.+)/);
      const urlMatch = frontendEnvContent.match(/NEXT_PUBLIC_API_BASE_URL=(.+)/);
      
      if (keyMatch && keyMatch[1]) {
        frontendApiKey = keyMatch[1];
      }
      
      if (urlMatch && urlMatch[1]) {
        frontendApiBaseUrl = urlMatch[1];
      }
    }
  } catch (error) {
    console.error('Error reading frontend .env.local:', error.message);
  }
  
  console.log(`Backend API Key: ${backendApiKey}`);
  console.log(`Frontend API Key: ${frontendApiKey}`);
  console.log(`Frontend API Base URL: ${frontendApiBaseUrl}`);
  
  return {
    backendApiKey,
    frontendApiKey,
    frontendApiBaseUrl
  };
}

// Check if backends are running
function checkServices() {
  return new Promise((resolve) => {
    console.log('\n🔍 Checking if services are running...');
    
    // Check backend
    let backendRunning = false;
    try {
      const request = http.get('http://localhost:3001/health', (response) => {
        backendRunning = response.statusCode === 200;
        response.on('data', () => {});
        response.on('end', () => {
          console.log(`Backend service: ${backendRunning ? '✅ Running' : '❌ Not running'}`);
          if (!backendRunning) {
            console.log('  Start backend with: npm run dev:backend');
          }
          resolve({ backendRunning });
        });
      });
      
      request.on('error', () => {
        console.log('Backend service: ❌ Not running');
        console.log('  Start backend with: npm run dev:backend');
        resolve({ backendRunning: false });
      });
      
      request.end();
    } catch (error) {
      console.log('Backend service: ❌ Not running');
      console.log('  Start backend with: npm run dev:backend');
      resolve({ backendRunning: false });
    }
  });
}

// Fix authentication issues
async function fixAuthentication() {
  console.log('\n🔧 Fixing authentication issues:');
  
  // Get current config
  const { backendApiKey, frontendApiKey, frontendApiBaseUrl } = getCurrentConfig();
  
  // Check for issues
  const issues = [];
  if (backendApiKey === 'Not set in environment' || !backendApiKey) {
    issues.push('Backend API key is not set');
  }
  
  if (frontendApiKey === 'Not found' || !frontendApiKey) {
    issues.push('Frontend API key is not set');
  }
  
  if (frontendApiBaseUrl === 'Not found' || !frontendApiBaseUrl) {
    issues.push('Frontend API base URL is not set');
  }
  
  if (backendApiKey !== frontendApiKey && backendApiKey !== 'Not set in environment' && frontendApiKey !== 'Not found') {
    issues.push('API keys in frontend and backend do not match');
  }
  
  if (issues.length === 0) {
    console.log('✅ No configuration issues detected.');
    return;
  }
  
  console.log('\n⚠️ Issues found:');
  issues.forEach(issue => console.log(`- ${issue}`));
  
  // Generate new API key if needed
  let newApiKey = backendApiKey;
  if (backendApiKey === 'Not set in environment' || !backendApiKey) {
    newApiKey = `etl-service-key-${Date.now().toString(36)}`;
    console.log(`\nGenerated new API key: ${newApiKey}`);
  }
  
  // Update backend .env
  if (backendApiKey === 'Not set in environment' || !backendApiKey) {
    const response = await new Promise(resolve => {
      rl.question('Update backend API key? (Y/n): ', answer => {
        resolve(answer.toLowerCase() !== 'n');
      });
    });
    
    if (response) {
      try {
        let envContent = '';
        if (fs.existsSync(backendEnvPath)) {
          envContent = fs.readFileSync(backendEnvPath, 'utf8');
          if (envContent.includes('API_KEY=')) {
            envContent = envContent.replace(/API_KEY=.*\n?/, `API_KEY=${newApiKey}\n`);
          } else {
            envContent += `\nAPI_KEY=${newApiKey}\n`;
          }
        } else {
          envContent = `API_KEY=${newApiKey}\n`;
        }
        
        fs.writeFileSync(backendEnvPath, envContent);
        console.log('✅ Updated backend .env file');
        
        // Also set in current environment
        process.env.API_KEY = newApiKey;
      } catch (error) {
        console.error('❌ Failed to update backend .env:', error.message);
      }
    }
  }
  
  // Update frontend .env.local
  const frontendApiKeyMissing = frontendApiKey === 'Not found' || !frontendApiKey;
  const frontendApiBaseUrlMissing = frontendApiBaseUrl === 'Not found' || !frontendApiBaseUrl;
  const apiKeyMismatch = backendApiKey !== frontendApiKey && backendApiKey !== 'Not set in environment' && frontendApiKey !== 'Not found';
  
  if (frontendApiKeyMissing || frontendApiBaseUrlMissing || apiKeyMismatch) {
    const response = await new Promise(resolve => {
      rl.question('Update frontend .env.local? (Y/n): ', answer => {
        resolve(answer.toLowerCase() !== 'n');
      });
    });
    
    if (response) {
      let apiBaseUrl = frontendApiBaseUrl;
      if (frontendApiBaseUrlMissing) {
        apiBaseUrl = await new Promise(resolve => {
          rl.question('Enter backend API URL (default: http://localhost:3001): ', answer => {
            resolve(answer || 'http://localhost:3001');
          });
        });
      }
      
      try {
        let envContent = '';
        if (fs.existsSync(frontendEnvPath)) {
          envContent = fs.readFileSync(frontendEnvPath, 'utf8');
          
          // Update API base URL
          if (envContent.includes('NEXT_PUBLIC_API_BASE_URL=')) {
            envContent = envContent.replace(/NEXT_PUBLIC_API_BASE_URL=.*\n?/, `NEXT_PUBLIC_API_BASE_URL=${apiBaseUrl}\n`);
          } else {
            envContent += `\nNEXT_PUBLIC_API_BASE_URL=${apiBaseUrl}\n`;
          }
          
          // Update API key
          if (envContent.includes('NEXT_PUBLIC_API_KEY=')) {
            envContent = envContent.replace(/NEXT_PUBLIC_API_KEY=.*\n?/, `NEXT_PUBLIC_API_KEY=${newApiKey}\n`);
          } else {
            envContent += `NEXT_PUBLIC_API_KEY=${newApiKey}\n`;
          }
        } else {
          envContent = `NEXT_PUBLIC_API_BASE_URL=${apiBaseUrl}\nNEXT_PUBLIC_API_KEY=${newApiKey}\n`;
        }
        
        // Ensure directory exists
        if (!fs.existsSync(path.dirname(frontendEnvPath))) {
          fs.mkdirSync(path.dirname(frontendEnvPath), { recursive: true });
        }
        
        fs.writeFileSync(frontendEnvPath, envContent);
        console.log('✅ Updated frontend .env.local file');
      } catch (error) {
        console.error('❌ Failed to update frontend .env.local:', error.message);
      }
    }
  }
  
  console.log('\n✅ Authentication fix completed');
  console.log('\nPlease restart both frontend and backend services:');
  console.log('- Backend: npm run dev:backend');
  console.log('- Frontend: npm run dev:frontend');
  console.log('- Or both: npm run dev');
}

// Main function
async function main() {
  console.log('🔐 ETL Services Authentication Fix Tool');
  
  // Check services
  await checkServices();
  
  // Fix authentication
  await fixAuthentication();
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
}); 