/**
 * Backend ETL Service Test
 * 
 * This script tests the ETL service functionality using the generated test data
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_KEY = process.env.API_KEY || 'serverless-etl-dev-key';
const TEST_DATA_DIR = path.join(__dirname, 'test-data');

// Test results directory
const testResultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

// Helper function to save test results
function saveTestResult(testName, data) {
  fs.writeFileSync(
    path.join(testResultsDir, `${testName}.json`),
    JSON.stringify(data, null, 2)
  );
}

// API client with authentication
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  }
});

// Run health check test
async function testHealthCheck() {
  try {
    console.log('Testing API health check...');
    const response = await apiClient.get('/health');
    console.log('✅ Health check successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Test CSV extraction
async function testCsvExtraction() {
  try {
    console.log('\nTesting CSV extraction...');
    const csvPath = path.join(TEST_DATA_DIR, 'users.csv');
    
    // Create extraction payload
    const extractPayload = {
      source: {
        type: 'file',
        format: 'csv',
        data: fs.readFileSync(csvPath, 'utf8'),
        options: {
          header: true,
          delimiter: ','
        }
      },
      options: {
        includeRawData: true
      }
    };
    
    const response = await apiClient.post('/extract', extractPayload);
    console.log('✅ CSV extraction successful');
    
    // Save the extraction result
    saveTestResult('csv-extraction', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ CSV extraction failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

// Test JSON extraction
async function testJsonExtraction() {
  try {
    console.log('\nTesting JSON extraction...');
    const jsonPath = path.join(TEST_DATA_DIR, 'products.json');
    
    // Create extraction payload
    const extractPayload = {
      source: {
        type: 'file',
        format: 'json',
        data: fs.readFileSync(jsonPath, 'utf8')
      },
      options: {
        includeRawData: true
      }
    };
    
    const response = await apiClient.post('/extract', extractPayload);
    console.log('✅ JSON extraction successful');
    
    // Save the extraction result
    saveTestResult('json-extraction', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ JSON extraction failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

// Test transformation
async function testTransformation(extractionResult) {
  if (!extractionResult) {
    console.error('❌ Transformation skipped: No extraction result available');
    return null;
  }
  
  try {
    console.log('\nTesting data transformation...');
    
    // Example transformation: add calculated fields
    const transformPayload = {
      data: extractionResult.data,
      transformations: {
        type: 'calculate',
        operations: [
          {
            name: 'discountPrice',
            formula: 'price * 0.9',
            applyTo: 'all'
          },
          {
            name: 'stockStatus',
            formula: 'inStock ? "Available" : "Out of Stock"',
            applyTo: 'all'
          }
        ]
      },
      options: {
        includeOriginalData: true
      }
    };
    
    const response = await apiClient.post('/transform', transformPayload);
    console.log('✅ Transformation successful');
    
    // Save the transformation result
    saveTestResult('transformation', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Transformation failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

// Test loading (simulating load to JSON file)
async function testLoading(transformationResult) {
  if (!transformationResult) {
    console.error('❌ Loading skipped: No transformation result available');
    return null;
  }
  
  try {
    console.log('\nTesting data loading...');
    
    // Example loading operation: save to a JSON file
    const loadPayload = {
      data: transformationResult.data,
      destination: {
        type: 'file',
        format: 'json',
        path: 'transformed-products.json'
      },
      options: {
        pretty: true
      }
    };
    
    const response = await apiClient.post('/load', loadPayload);
    console.log('✅ Loading successful');
    
    // Save the loading result
    saveTestResult('loading', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Loading failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

// Test complete ETL orchestration
async function testOrchestration() {
  try {
    console.log('\nTesting ETL orchestration...');
    const csvPath = path.join(TEST_DATA_DIR, 'users.csv');
    
    // Create orchestration payload for complete ETL pipeline
    const orchestrationPayload = {
      source: {
        type: 'file',
        format: 'csv',
        data: fs.readFileSync(csvPath, 'utf8'),
        options: {
          header: true
        }
      },
      transformations: [
        {
          type: 'filter',
          condition: 'age > 30'
        },
        {
          type: 'calculate',
          operations: [
            {
              name: 'ageGroup',
              formula: 'age < 35 ? "30-35" : "35+"'
            }
          ]
        }
      ],
      destination: {
        type: 'memory',
        format: 'json'
      },
      options: {
        includeIntermediateResults: true
      }
    };
    
    const response = await apiClient.post('/orchestrate', orchestrationPayload);
    console.log('✅ ETL orchestration successful');
    
    // Save the orchestration result
    saveTestResult('orchestration', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ ETL orchestration failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('======== BACKEND ETL SERVICE TESTS ========');
  
  // First check if the service is running
  const isHealthy = await testHealthCheck();
  if (!isHealthy) {
    console.error('❌ API is not available. Make sure the backend server is running.');
    return;
  }
  
  // Run extraction tests
  const jsonExtractionResult = await testJsonExtraction();
  
  // Run transformation test with JSON data
  const transformationResult = await testTransformation(jsonExtractionResult);
  
  // Run loading test
  await testLoading(transformationResult);
  
  // Test full ETL pipeline
  await testOrchestration();
  
  console.log('\n======== TEST SUMMARY ========');
  console.log(`Test results saved to: ${testResultsDir}`);
  console.log('All tests completed.');
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test execution error:', error);
}); 