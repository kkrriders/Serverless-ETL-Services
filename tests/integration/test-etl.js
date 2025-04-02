/**
 * Integration test for the ETL pipeline
 * 
 * This script tests the entire ETL pipeline with different sources and destinations.
 * It can be run with: node tests/integration/test-etl.js
 */
require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { ensureTempDir, cleanupTempFiles } = require('../../src/utils/fileUtils');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'your_api_key_here';
const TEMP_DIR = path.join(__dirname, '../../temp');

// Test data
const testData = [
  { id: 1, name: 'Product A', description: 'A basic product for testing' },
  { id: 2, name: 'Product B', description: 'A simple gadget for demo purposes' },
  { id: 3, name: 'Product C', description: 'An essential tool for developers' },
];

// Main test function
async function runTests() {
  console.log('Starting ETL integration tests...');
  
  try {
    // Ensure temp directory exists
    await ensureTempDir(TEMP_DIR);
    
    // Create a test file
    const testFilePath = path.join(TEMP_DIR, 'test-data.json');
    await fs.writeFile(testFilePath, JSON.stringify(testData, null, 2));
    
    // Test health endpoint
    await testHealthEndpoint();
    
    // Test extract endpoint with file source
    const extractResult = await testExtract(testFilePath);
    
    // Test transform endpoint
    const transformResult = await testTransform(extractResult.data);
    
    // Test load endpoint with file destination
    const outputFilePath = path.join(TEMP_DIR, 'output-data.json');
    await testLoad(transformResult.data, outputFilePath);
    
    // Test orchestrate endpoint
    await testOrchestrate(testFilePath, path.join(TEMP_DIR, 'orchestrated-data.json'));
    
    // Clean up temp files
    await cleanupTempFiles(TEMP_DIR);
    
    console.log('\n✅ All tests completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Test health endpoint
async function testHealthEndpoint() {
  console.log('\n🔍 Testing health endpoint...');
  
  const response = await axios.get(`${API_URL}/health`);
  
  console.log(`  Status: ${response.data.status}`);
  console.log(`  Ollama: ${response.data.ollama}`);
  
  if (response.data.status !== 'OK') {
    throw new Error('Health check failed');
  }
  
  console.log('  ✅ Health endpoint test passed');
  return response.data;
}

// Test extract endpoint
async function testExtract(filePath) {
  console.log('\n🔍 Testing extract endpoint with file source...');
  
  const response = await axios.post(
    `${API_URL}/extract`,
    {
      source: {
        type: 'file',
        path: filePath,
        format: 'json',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    },
  );
  
  if (!response.data.success) {
    throw new Error('Extract test failed');
  }
  
  console.log(`  Extracted ${response.data.data.length} records`);
  console.log('  ✅ Extract endpoint test passed');
  
  return response.data;
}

// Test transform endpoint
async function testTransform(data) {
  console.log('\n🔍 Testing transform endpoint with data enrichment...');
  
  const response = await axios.post(
    `${API_URL}/transform`,
    {
      data: data,
      transformations: {
        clean: {
          removeEmpty: true,
          textFields: ['name', 'description'],
        },
        enrich: {
          instruction: 'Generate a more detailed product description with at least 3 benefits for each item',
          fields: ['description'],
        },
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    },
  );
  
  if (!response.data.success) {
    throw new Error('Transform test failed');
  }
  
  console.log(`  Transformed ${response.data.data.length} records`);
  console.log('  ✅ Transform endpoint test passed');
  
  return response.data;
}

// Test load endpoint
async function testLoad(data, outputFilePath) {
  console.log('\n🔍 Testing load endpoint with file destination...');
  
  const response = await axios.post(
    `${API_URL}/load`,
    {
      data: data,
      destination: {
        type: 'file',
        path: outputFilePath,
        format: 'json',
        options: {
          pretty: true,
        },
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    },
  );
  
  if (!response.data.success) {
    throw new Error('Load test failed');
  }
  
  console.log(`  Loaded data to ${outputFilePath}`);
  console.log('  ✅ Load endpoint test passed');
  
  return response.data;
}

// Test orchestrate endpoint
async function testOrchestrate(inputFilePath, outputFilePath) {
  console.log('\n🔍 Testing orchestrate endpoint (end-to-end pipeline)...');
  
  const response = await axios.post(
    `${API_URL}/orchestrate`,
    {
      source: {
        type: 'file',
        path: inputFilePath,
        format: 'json',
      },
      transformations: {
        clean: {
          removeEmpty: true,
        },
        enrich: {
          instruction: 'For each product, generate a marketing tagline that highlights its key benefit',
          fields: ['description'],
        },
      },
      destination: {
        type: 'file',
        path: outputFilePath,
        format: 'json',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    },
  );
  
  if (!response.data.success) {
    throw new Error('Orchestrate test failed');
  }
  
  console.log(`  Completed ETL pipeline in ${response.data.processingDuration || 'unknown'}ms`);
  console.log('  ✅ Orchestrate endpoint test passed');
  
  return response.data;
}

// Run the tests
runTests().catch(error => {
  console.error('Error in test runner:', error);
  process.exit(1);
}); 