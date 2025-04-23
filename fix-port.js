/**
 * Port Configuration Fix Script for ETL Services
 * 
 * This script helps fix port configuration mismatches between frontend and backend.
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
const frontendDir = path.join(rootDir, 'etl-dashboard-backup/etl-dashboard');
const frontendEnvPath = path.join(frontendDir, '.env.local');

// Check server port
async function checkServerPort() {
  console.log('🔍 Checking backend server port...');

  // Try ports 3000 and 3001
  let port3000Running = false;
  let port3001Running = false;

  try {
    // Check port 3000
    await new Promise((resolve) => {
      const request = http.get('http://localhost:3000/health', (response) => {
        port3000Running = response.statusCode === 200;
        response.on('data', () => {});
        response.on('end', () => {
          console.log(`Backend on port 3000: ${port3000Running ? '✅ Running' : '❌ Not running'}`);
          resolve();
        });
      });
      
      request.on('error', () => {
        console.log('Backend on port 3000: ❌ Not running');
        resolve();
      });
      
      request.setTimeout(1000, () => {
        request.abort();
        resolve();
      });
    });

    // Check port 3001
    await new Promise((resolve) => {
      const request = http.get('http://localhost:3001/health', (response) => {
        port3001Running = response.statusCode === 200;
        response.on('data', () => {});
        response.on('end', () => {
          console.log(`Backend on port 3001: ${port3001Running ? '✅ Running' : '❌ Not running'}`);
          resolve();
        });
      });
      
      request.on('error', () => {
        console.log('Backend on port 3001: ❌ Not running');
        resolve();
      });
      
      request.setTimeout(1000, () => {
        request.abort();
        resolve();
      });
    });

    return { port3000Running, port3001Running };
  } catch (error) {
    console.error('Error checking server ports:', error.message);
    return { port3000Running: false, port3001Running: false };
  }
}

// Get current frontend config
function getCurrentFrontendConfig() {
  console.log('\n📊 Current Frontend Configuration:');
  
  let apiBaseUrl = 'Not found';
  
  try {
    if (fs.existsSync(frontendEnvPath)) {
      const envContent = fs.readFileSync(frontendEnvPath, 'utf8');
      const match = envContent.match(/NEXT_PUBLIC_API_BASE_URL=(.+)/);
      
      if (match && match[1]) {
        apiBaseUrl = match[1];
      }
    }
  } catch (error) {
    console.error('Error reading frontend .env.local:', error.message);
  }
  
  console.log(`Frontend API Base URL: ${apiBaseUrl}`);
  
  return { apiBaseUrl };
}

// Fix port configuration
async function fixPortConfiguration(serverPorts) {
  const { port3000Running, port3001Running } = serverPorts;
  const { apiBaseUrl } = getCurrentFrontendConfig();
  
  // Determine correct backend port
  let correctBackendPort = null;
  
  if (port3000Running) {
    correctBackendPort = 3000;
  } else if (port3001Running) {
    correctBackendPort = 3001;
  } else {
    console.log('\n❌ Backend server is not running on either port 3000 or 3001.');
    console.log('Please start the backend server first with: npm run dev:backend');
    return false;
  }
  
  console.log(`\n✅ Detected backend server running on port ${correctBackendPort}`);
  
  // Check if frontend API URL is correctly configured
  const correctApiBaseUrl = `http://localhost:${correctBackendPort}`;
  
  if (apiBaseUrl === correctApiBaseUrl) {
    console.log('✅ Frontend is already configured with the correct API URL.');
    return true;
  }
  
  // Update frontend configuration
  console.log(`\n⚠️ Frontend API URL needs to be updated to: ${correctApiBaseUrl}`);
  
  const response = await new Promise(resolve => {
    rl.question('Update frontend API URL? (Y/n): ', answer => {
      resolve(answer.toLowerCase() !== 'n');
    });
  });
  
  if (response) {
    try {
      let envContent = '';
      
      if (fs.existsSync(frontendEnvPath)) {
        envContent = fs.readFileSync(frontendEnvPath, 'utf8');
        
        if (envContent.includes('NEXT_PUBLIC_API_BASE_URL=')) {
          envContent = envContent.replace(
            /NEXT_PUBLIC_API_BASE_URL=.*/,
            `NEXT_PUBLIC_API_BASE_URL=${correctApiBaseUrl}`
          );
        } else {
          envContent += `\nNEXT_PUBLIC_API_BASE_URL=${correctApiBaseUrl}\n`;
        }
      } else {
        envContent = `NEXT_PUBLIC_API_BASE_URL=${correctApiBaseUrl}\n`;
      }
      
      fs.writeFileSync(frontendEnvPath, envContent);
      console.log('✅ Updated frontend .env.local file with correct API URL');
      return true;
    } catch (error) {
      console.error('❌ Failed to update frontend configuration:', error.message);
      return false;
    }
  } else {
    console.log('⚠️ Frontend configuration not updated.');
    return false;
  }
}

// Main function
async function main() {
  console.log('🔧 ETL Services Port Configuration Fix Tool');
  
  // Check server ports
  const serverPorts = await checkServerPort();
  
  // Fix port configuration if needed
  const fixed = await fixPortConfiguration(serverPorts);
  
  if (fixed) {
    console.log('\n✅ Port configuration fix completed.');
    console.log('\nPlease restart the frontend service:');
    console.log('npm run dev:frontend');
    console.log('\nOr restart both services:');
    console.log('npm run dev');
  } else {
    console.log('\n⚠️ Port configuration could not be fixed automatically.');
    console.log('\nPlease ensure:');
    console.log('1. The backend server is running (npm run dev:backend)');
    console.log('2. The frontend .env.local file contains the correct API URL:');
    console.log('   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 (or the correct port)');
    console.log('3. Restart the services after making changes');
  }
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
}); 