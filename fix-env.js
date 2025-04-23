/**
 * Complete Environment Configuration Fix
 * 
 * This script ensures all environment files are correctly set up
 * with matching API keys and correct port configurations.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Paths
const rootDir = __dirname;
const backendEnvPath = path.join(rootDir, '.env');
const frontendDir = path.join(rootDir, 'etl-dashboard-backup/etl-dashboard');
const frontendEnvPath = path.join(frontendDir, '.env.local');

// Default values
const DEFAULT_API_KEY = 'serverless-etl-dev-key';
const DEFAULT_PORT = 3000;

// Get existing configuration
function getExistingConfig() {
  console.log('🔍 Checking existing configuration...');
  
  // Backend
  let backendPort = DEFAULT_PORT;
  let backendApiKey = DEFAULT_API_KEY;
  let backendEnvExists = false;
  
  try {
    if (fs.existsSync(backendEnvPath)) {
      backendEnvExists = true;
      const backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
      
      const portMatch = backendEnvContent.match(/PORT=(\d+)/);
      if (portMatch && portMatch[1]) {
        backendPort = parseInt(portMatch[1], 10);
      }
      
      const apiKeyMatch = backendEnvContent.match(/API_KEY=(.+)/);
      if (apiKeyMatch && apiKeyMatch[1]) {
        backendApiKey = apiKeyMatch[1].trim();
      }
    }
  } catch (error) {
    console.error('Error reading backend .env:', error.message);
  }
  
  // Frontend
  let frontendApiUrl = null;
  let frontendApiKey = null;
  let frontendEnvExists = false;
  
  try {
    if (fs.existsSync(frontendEnvPath)) {
      frontendEnvExists = true;
      const frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');
      
      const urlMatch = frontendEnvContent.match(/NEXT_PUBLIC_API_BASE_URL=(.+)/);
      if (urlMatch && urlMatch[1]) {
        frontendApiUrl = urlMatch[1].trim();
      }
      
      const keyMatch = frontendEnvContent.match(/NEXT_PUBLIC_API_KEY=(.+)/);
      if (keyMatch && keyMatch[1]) {
        frontendApiKey = keyMatch[1].trim();
      }
    }
  } catch (error) {
    console.error('Error reading frontend .env.local:', error.message);
  }
  
  // Log current config
  console.log('\n📊 Current Configuration:');
  console.log(`Backend .env exists: ${backendEnvExists ? 'Yes' : 'No'}`);
  console.log(`Backend port: ${backendPort}`);
  console.log(`Backend API key: ${backendApiKey ? backendApiKey.substring(0, 4) + '...' : 'Not set'}`);
  console.log(`Frontend .env.local exists: ${frontendEnvExists ? 'Yes' : 'No'}`);
  console.log(`Frontend API URL: ${frontendApiUrl || 'Not set'}`);
  console.log(`Frontend API key: ${frontendApiKey ? frontendApiKey.substring(0, 4) + '...' : 'Not set'}`);
  
  return {
    backendPort,
    backendApiKey,
    backendEnvExists,
    frontendApiUrl,
    frontendApiKey,
    frontendEnvExists
  };
}

// Create or update backend .env
async function fixBackendEnv(config) {
  console.log('\n🔧 Fixing backend .env file...');
  
  const createOrUpdate = await new Promise(resolve => {
    if (config.backendEnvExists) {
      rl.question('Update backend .env file? (Y/n): ', answer => {
        resolve(answer.toLowerCase() !== 'n');
      });
    } else {
      rl.question('Create backend .env file? (Y/n): ', answer => {
        resolve(answer.toLowerCase() !== 'n');
      });
    }
  });
  
  if (!createOrUpdate) {
    console.log('⚠️ Backend .env not updated');
    return config;
  }
  
  // Get API key to use
  const apiKey = await new Promise(resolve => {
    if (config.backendApiKey) {
      rl.question(`Use existing API key (${config.backendApiKey.substring(0, 4)}...)? (Y/n): `, answer => {
        if (answer.toLowerCase() === 'n') {
          rl.question('Enter new API key (or press Enter to generate one): ', newKey => {
            resolve(newKey || `serverless-etl-key-${Date.now().toString(36)}`);
          });
        } else {
          resolve(config.backendApiKey);
        }
      });
    } else {
      const defaultKey = DEFAULT_API_KEY;
      rl.question(`Use default API key (${defaultKey.substring(0, 4)}...)? (Y/n): `, answer => {
        if (answer.toLowerCase() === 'n') {
          rl.question('Enter new API key (or press Enter to generate one): ', newKey => {
            resolve(newKey || `serverless-etl-key-${Date.now().toString(36)}`);
          });
        } else {
          resolve(defaultKey);
        }
      });
    }
  });
  
  // Get port to use
  const port = await new Promise(resolve => {
    if (config.backendPort) {
      rl.question(`Use existing port (${config.backendPort})? (Y/n): `, answer => {
        if (answer.toLowerCase() === 'n') {
          rl.question('Enter new port: ', newPort => {
            resolve(parseInt(newPort, 10) || DEFAULT_PORT);
          });
        } else {
          resolve(config.backendPort);
        }
      });
    } else {
      rl.question(`Use default port (${DEFAULT_PORT})? (Y/n): `, answer => {
        if (answer.toLowerCase() === 'n') {
          rl.question('Enter new port: ', newPort => {
            resolve(parseInt(newPort, 10) || DEFAULT_PORT);
          });
        } else {
          resolve(DEFAULT_PORT);
        }
      });
    }
  });
  
  // Create backend .env content
  const backendEnvContent = `# Server Configuration
PORT=${port}

# Authentication
API_KEY=${apiKey}

# For admin endpoints
ADMIN_API_KEY=serverless-etl-admin-key

# Logging
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
`;
  
  try {
    fs.writeFileSync(backendEnvPath, backendEnvContent);
    console.log('✅ Backend .env file updated successfully');
    
    // Update config
    return {
      ...config,
      backendPort: port,
      backendApiKey: apiKey,
      backendEnvExists: true
    };
  } catch (error) {
    console.error('❌ Failed to update backend .env:', error.message);
    return config;
  }
}

// Create or update frontend .env.local
async function fixFrontendEnv(config) {
  console.log('\n🔧 Fixing frontend .env.local file...');
  
  const createOrUpdate = await new Promise(resolve => {
    if (config.frontendEnvExists) {
      rl.question('Update frontend .env.local file? (Y/n): ', answer => {
        resolve(answer.toLowerCase() !== 'n');
      });
    } else {
      rl.question('Create frontend .env.local file? (Y/n): ', answer => {
        resolve(answer.toLowerCase() !== 'n');
      });
    }
  });
  
  if (!createOrUpdate) {
    console.log('⚠️ Frontend .env.local not updated');
    return;
  }
  
  // Construct expected API URL
  const correctApiUrl = `http://localhost:${config.backendPort}`;
  
  // Check if frontend API URL matches expected URL
  const apiUrlNeedsUpdate = config.frontendApiUrl !== correctApiUrl;
  
  // Check if frontend API key matches backend API key
  const apiKeyNeedsUpdate = config.frontendApiKey !== config.backendApiKey;
  
  if (!apiUrlNeedsUpdate && !apiKeyNeedsUpdate) {
    console.log('✅ Frontend .env.local is already correctly configured');
    return;
  }
  
  // Create frontend .env.local content
  const frontendEnvContent = `# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=${correctApiUrl}
NEXT_PUBLIC_API_KEY=${config.backendApiKey}
`;
  
  try {
    // Ensure directory exists
    if (!fs.existsSync(path.dirname(frontendEnvPath))) {
      fs.mkdirSync(path.dirname(frontendEnvPath), { recursive: true });
    }
    
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log('✅ Frontend .env.local file updated successfully');
    
    if (apiUrlNeedsUpdate) {
      console.log(`✅ Updated API URL to: ${correctApiUrl}`);
    }
    
    if (apiKeyNeedsUpdate) {
      console.log(`✅ Updated API key to match backend`);
    }
  } catch (error) {
    console.error('❌ Failed to update frontend .env.local:', error.message);
  }
}

// Main function
async function main() {
  console.log('🔧 Complete Environment Configuration Fix');
  
  // Get existing configuration
  const config = getExistingConfig();
  
  // Fix backend .env
  const updatedConfig = await fixBackendEnv(config);
  
  // Fix frontend .env.local
  await fixFrontendEnv(updatedConfig);
  
  console.log('\n🎉 Environment configuration fix completed.');
  console.log('\nFor the changes to take effect, please restart your services:');
  console.log('1. Backend: npm run dev:backend');
  console.log('2. Frontend: npm run dev:frontend');
  console.log('3. Or both together: npm run dev');
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
}); 