/**
 * ETL Server Diagnostic and Fix Tool
 * 
 * This script helps diagnose and fix backend server issues including:
 * - Server not running
 * - Port configuration problems
 * - Health endpoint errors
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, spawn } = require('child_process');
const http = require('http');
const net = require('net');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Paths
const rootDir = __dirname;
const serverPath = path.join(rootDir, 'src', 'server.js');
const appPath = path.join(rootDir, 'src', 'app.js');
const routesPath = path.join(rootDir, 'src', 'routes', 'index.js');
const frontendDir = path.join(rootDir, 'etl-dashboard-backup/etl-dashboard');
const frontendEnvPath = path.join(frontendDir, '.env.local');
const dotEnvPath = path.join(rootDir, '.env');

// Server ports to check
const SERVER_PORTS = [3000, 3001, 8080];

// Check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// Check if backend server is running and on which port
async function checkBackendServer() {
  console.log('🔍 Checking if backend server is running...');
  
  let serverRunning = false;
  let serverPort = null;
  let healthEndpointWorking = false;
  
  // Check each common port
  for (const port of SERVER_PORTS) {
    const portInUse = await isPortInUse(port);
    console.log(`Checking port ${port}: ${portInUse ? '🔌 In use' : '⚪ Free'}`);
    
    if (portInUse) {
      // Try to access the health endpoint
      try {
        const healthUrl = `http://localhost:${port}/health`;
        console.log(`Testing health endpoint at: ${healthUrl}`);
        
        await new Promise((resolve) => {
          const request = http.get(healthUrl, (response) => {
            if (response.statusCode === 200) {
              serverRunning = true;
              serverPort = port;
              healthEndpointWorking = true;
              console.log(`✅ Backend server running on port ${port} with working health endpoint`);
              
              // Read some data to confirm it's our server
              let data = '';
              response.on('data', (chunk) => {
                data += chunk;
              });
              
              response.on('end', () => {
                try {
                  const json = JSON.parse(data);
                  if (json.status === 'OK' && json.message === 'Service is running') {
                    console.log('✅ Confirmed ETL service is running');
                  }
                } catch (e) {
                  // Not JSON or not our service
                  serverRunning = false;
                  console.log('❌ Response received but not from our ETL service');
                }
                resolve();
              });
            } else {
              console.log(`❌ Backend health check returned status ${response.statusCode}`);
              resolve();
            }
          });
          
          request.on('error', () => {
            console.log(`❌ Could not connect to health endpoint on port ${port}`);
            resolve();
          });
          
          request.setTimeout(2000, () => {
            request.abort();
            console.log(`⏱️ Connection timeout on port ${port}`);
            resolve();
          });
        });
      } catch (error) {
        console.error(`Error checking port ${port}:`, error.message);
      }
    }
  }
  
  if (!serverRunning) {
    console.log('❌ Backend server is not running or health endpoint is not accessible');
  }
  
  return { serverRunning, serverPort, healthEndpointWorking };
}

// Check frontend configuration
function checkFrontendConfig() {
  console.log('\n📊 Checking frontend configuration...');
  
  let apiBaseUrl = null;
  let apiKey = null;
  
  try {
    if (fs.existsSync(frontendEnvPath)) {
      const envContent = fs.readFileSync(frontendEnvPath, 'utf8');
      const urlMatch = envContent.match(/NEXT_PUBLIC_API_BASE_URL=(.+)/);
      const keyMatch = envContent.match(/NEXT_PUBLIC_API_KEY=(.+)/);
      
      if (urlMatch && urlMatch[1]) {
        apiBaseUrl = urlMatch[1];
      }
      
      if (keyMatch && keyMatch[1]) {
        apiKey = keyMatch[1];
      }
      
      console.log(`Frontend API URL: ${apiBaseUrl || 'Not configured'}`);
      console.log(`Frontend API Key: ${apiKey ? '✅ Configured' : '❌ Not configured'}`);
    } else {
      console.log('❌ Frontend .env.local file not found');
    }
  } catch (error) {
    console.error('Error reading frontend configuration:', error.message);
  }
  
  return { apiBaseUrl, apiKey };
}

// Check backend code for health endpoint
function checkHealthEndpoint() {
  console.log('\n🔍 Checking health endpoint in code...');
  
  let healthEndpointFound = false;
  let healthEndpointLine = null;
  
  try {
    if (fs.existsSync(routesPath)) {
      const routesContent = fs.readFileSync(routesPath, 'utf8');
      const lines = routesContent.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('router.get(\'/health\'')) {
          healthEndpointFound = true;
          healthEndpointLine = i + 1;
          console.log(`✅ Health endpoint found in routes at line ${healthEndpointLine}`);
          break;
        }
      }
      
      if (!healthEndpointFound) {
        console.log('❌ Health endpoint not found in routes');
      }
    } else {
      console.log('❌ Routes file not found');
    }
  } catch (error) {
    console.error('Error checking health endpoint in code:', error.message);
  }
  
  return { healthEndpointFound, healthEndpointLine };
}

// Check server port configuration
function checkServerPortConfig() {
  console.log('\n🔍 Checking server port configuration...');
  
  let serverConfiguredPort = null;
  
  try {
    if (fs.existsSync(serverPath)) {
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      // Look for port configuration
      const portMatch = serverContent.match(/const PORT\s*=\s*(?:process\.env\.PORT\s*\|\|\s*)?(\d+)/);
      
      if (portMatch && portMatch[1]) {
        serverConfiguredPort = parseInt(portMatch[1], 10);
        console.log(`✅ Server configured to use port ${serverConfiguredPort}`);
      } else {
        console.log('❓ Could not determine server port from code');
      }
    } else {
      console.log('❌ Server file not found');
    }
    
    // Check .env file for PORT
    if (fs.existsSync(dotEnvPath)) {
      const envContent = fs.readFileSync(dotEnvPath, 'utf8');
      const portMatch = envContent.match(/PORT=(\d+)/);
      
      if (portMatch && portMatch[1]) {
        console.log(`ℹ️ PORT defined in .env file: ${portMatch[1]}`);
        if (serverConfiguredPort && serverConfiguredPort !== parseInt(portMatch[1], 10)) {
          console.log('⚠️ PORT in .env differs from default in server code');
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking server port configuration:', error.message);
  }
  
  return { serverConfiguredPort };
}

// Update frontend API URL
async function updateFrontendApiUrl(correctPort) {
  console.log('\n🔧 Updating frontend API URL...');
  
  const { apiBaseUrl } = checkFrontendConfig();
  const correctApiBaseUrl = `http://localhost:${correctPort}`;
  
  if (apiBaseUrl === correctApiBaseUrl) {
    console.log('✅ Frontend API URL is already correct');
    return true;
  }
  
  const response = await new Promise(resolve => {
    rl.question(`Update frontend API URL to ${correctApiBaseUrl}? (Y/n): `, answer => {
      resolve(answer.toLowerCase() !== 'n');
    });
  });
  
  if (response) {
    try {
      let envContent = '';
      
      if (fs.existsSync(frontendEnvPath)) {
        envContent = fs.readFileSync(frontendEnvPath, 'utf8');
        
        if (envContent.includes('NEXT_PUBLIC_API_BASE_URL=')) {
          envContent = envContent.replace(/NEXT_PUBLIC_API_BASE_URL=.*\n?/, `NEXT_PUBLIC_API_BASE_URL=${correctApiBaseUrl}\n`);
        } else {
          envContent += `\nNEXT_PUBLIC_API_BASE_URL=${correctApiBaseUrl}\n`;
        }
      } else {
        // If .env.local doesn't exist, create it with the API URL
        envContent = `NEXT_PUBLIC_API_BASE_URL=${correctApiBaseUrl}\n`;
        
        // Ensure directory exists
        if (!fs.existsSync(path.dirname(frontendEnvPath))) {
          fs.mkdirSync(path.dirname(frontendEnvPath), { recursive: true });
        }
      }
      
      fs.writeFileSync(frontendEnvPath, envContent);
      console.log('✅ Updated frontend API URL');
      return true;
    } catch (error) {
      console.error('❌ Failed to update frontend API URL:', error.message);
      return false;
    }
  } else {
    console.log('⚠️ Frontend API URL not updated');
    return false;
  }
}

// Start the backend server
async function startBackendServer() {
  console.log('\n🚀 Starting backend server...');
  
  const startServer = await new Promise(resolve => {
    rl.question('Start the backend server? (Y/n): ', answer => {
      resolve(answer.toLowerCase() !== 'n');
    });
  });
  
  if (startServer) {
    try {
      console.log('Starting backend server in a new process...');
      console.log('(You will need to manually terminate this process later)');
      
      // Use spawn to start the server in a new process
      const serverProcess = spawn('node', ['src/server.js'], {
        stdio: 'inherit',
        detached: true
      });
      
      // Unref to allow the parent process to exit independently
      serverProcess.unref();
      
      console.log('✅ Server process started');
      console.log('Waiting for server to initialize...');
      
      // Wait a moment for the server to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if the server is now running
      const { serverRunning, serverPort } = await checkBackendServer();
      
      if (serverRunning) {
        console.log(`✅ Backend server successfully started on port ${serverPort}`);
        
        // Update frontend configuration if needed
        await updateFrontendApiUrl(serverPort);
        
        return { success: true, serverPort };
      } else {
        console.log('❌ Server did not start successfully');
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Failed to start backend server:', error.message);
      return { success: false };
    }
  } else {
    console.log('⚠️ Server not started');
    return { success: false };
  }
}

// Fix functions - adding health endpoint if missing
async function fixHealthEndpoint() {
  console.log('\n🔧 Fixing health endpoint...');
  
  const { healthEndpointFound } = checkHealthEndpoint();
  
  if (healthEndpointFound) {
    console.log('✅ Health endpoint exists in the code, no fix needed');
    return true;
  }
  
  const fixEndpoint = await new Promise(resolve => {
    rl.question('Add a health endpoint to the routes? (Y/n): ', answer => {
      resolve(answer.toLowerCase() !== 'n');
    });
  });
  
  if (fixEndpoint) {
    try {
      if (fs.existsSync(routesPath)) {
        let routesContent = fs.readFileSync(routesPath, 'utf8');
        const lines = routesContent.split('\n');
        
        // Find a good position to insert the health endpoint
        let insertPosition = -1;
        let insertAfter = 'router.get(\'/';
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(insertAfter)) {
            insertPosition = i + 1;
            break;
          }
        }
        
        if (insertPosition === -1) {
          // If we couldn't find a good position, look for the router initialization
          insertAfter = 'const router = express.Router()';
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(insertAfter)) {
              insertPosition = i + 1;
              break;
            }
          }
        }
        
        if (insertPosition !== -1) {
          // Health endpoint code to insert
          const healthEndpointCode = `
// Health check endpoint (public)
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Service is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});`;
          
          lines.splice(insertPosition, 0, healthEndpointCode);
          routesContent = lines.join('\n');
          
          fs.writeFileSync(routesPath, routesContent);
          console.log('✅ Added health endpoint to routes');
          return true;
        } else {
          console.log('❌ Could not find a suitable position to insert health endpoint');
          return false;
        }
      } else {
        console.log('❌ Routes file not found');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to add health endpoint:', error.message);
      return false;
    }
  } else {
    console.log('⚠️ Health endpoint not added');
    return false;
  }
}

// Main function
async function main() {
  console.log('🔧 ETL Server Diagnostic Tool');
  
  // Check if backend server is running
  const { serverRunning, serverPort, healthEndpointWorking } = await checkBackendServer();
  
  // Check configuration
  checkFrontendConfig();
  checkHealthEndpoint();
  const { serverConfiguredPort } = checkServerPortConfig();
  
  // Identify issues
  const issues = [];
  
  if (!serverRunning) {
    issues.push('Backend server is not running');
  }
  
  if (serverRunning && !healthEndpointWorking) {
    issues.push('Health endpoint is not working properly');
  }
  
  const { apiBaseUrl } = checkFrontendConfig();
  if (serverRunning && serverPort && apiBaseUrl && !apiBaseUrl.includes(`:${serverPort}`)) {
    issues.push('Frontend API URL does not match backend server port');
  }
  
  // Fix issues
  if (issues.length > 0) {
    console.log('\n⚠️ Issues found:');
    issues.forEach(issue => console.log(`- ${issue}`));
    
    // Fix health endpoint if needed
    if (!serverRunning || !healthEndpointWorking) {
      await fixHealthEndpoint();
    }
    
    // Start server if it's not running
    if (!serverRunning) {
      const { success, serverPort: newServerPort } = await startBackendServer();
      
      if (success) {
        // Update frontend API URL if needed
        await updateFrontendApiUrl(newServerPort);
      }
    } else if (serverRunning && serverPort) {
      // Update frontend API URL if needed
      await updateFrontendApiUrl(serverPort);
    }
  } else {
    console.log('\n✅ No issues found. Everything appears to be working correctly.');
  }
  
  console.log('\n🔧 Diagnostic completed.');
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
}); 