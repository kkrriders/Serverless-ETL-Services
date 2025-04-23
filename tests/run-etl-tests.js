/**
 * ETL Integration Test Runner
 * 
 * This script runs the full ETL integration test suite:
 * 1. Generate test data
 * 2. Test backend ETL services
 * 3. Test frontend integration
 */
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting ETL Integration Tests');

// Set API key environment variable
process.env.API_KEY = process.env.API_KEY || 'serverless-etl-dev-key';

// Step 1: Generate test data
console.log('\n📦 Step 1: Generating test data...');
try {
  execSync('node tests/generate-test-data.js', { stdio: 'inherit' });
  console.log('✅ Test data generation completed');
} catch (error) {
  console.error('❌ Test data generation failed:', error.message);
  process.exit(1);
}

// Step 2: Check if backend is running
console.log('\n🔍 Step 2: Checking if backend server is running...');

// Try a simple health check
const http = require('http');
const backendUrl = 'http://localhost:3001/health';

function checkBackendHealth() {
  return new Promise((resolve, reject) => {
    const request = http.get(backendUrl, (response) => {
      if (response.statusCode === 200) {
        response.on('data', () => {});
        response.on('end', () => {
          resolve(true);
        });
      } else {
        reject(new Error(`Backend health check failed: ${response.statusCode}`));
      }
    });
    
    request.on('error', (error) => {
      reject(new Error('Backend server is not running. Please start it with: npm run dev:backend'));
    });
    
    request.end();
  });
}

// Step 3: Run backend ETL tests
async function runBackendTests() {
  console.log('\n🧪 Step 3: Running backend ETL tests...');
  try {
    execSync('node tests/backend-etl-test.js', { 
      stdio: 'inherit',
      env: { ...process.env, API_BASE_URL: 'http://localhost:3001', API_KEY: process.env.API_KEY }
    });
    console.log('✅ Backend ETL tests completed');
    return true;
  } catch (error) {
    console.error('❌ Backend ETL tests failed:', error.message);
    return false;
  }
}

// Step 4: Provide instructions for frontend testing
function provideFrontendInstructions() {
  console.log('\n📱 Step 4: Frontend ETL Testing');
  console.log(`
To test the frontend ETL functionality:

1. Make sure both backend and frontend are running:
   $ npm run dev

2. Navigate to the File ETL page in your browser:
   http://localhost:3000/file-etl

3. Upload one of the test files from the tests/test-data directory:
   - ${path.resolve(__dirname, 'test-data/users.csv')}
   - ${path.resolve(__dirname, 'test-data/products.json')}
   - ${path.resolve(__dirname, 'test-data/orders.xml')}
   - ${path.resolve(__dirname, 'test-data/application.log')}

4. Follow the ETL pipeline steps in the UI:
   - Extract: Process the uploaded file
   - Transform: Apply transformations (e.g., filter by condition)
   - Load: Process the transformed data
   - Result: View the final results
  `);
}

// Main execution
async function runTests() {
  try {
    // Check if backend is running
    await checkBackendHealth();
    console.log('✅ Backend server is running');
    
    // Run backend tests
    const backendTestsSucceeded = await runBackendTests();
    
    // Provide frontend testing instructions
    provideFrontendInstructions();
    
    if (backendTestsSucceeded) {
      console.log('\n🎉 ETL integration test setup completed successfully!');
    } else {
      console.log('\n⚠️ ETL integration test setup completed with some failures. See logs above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests(); 