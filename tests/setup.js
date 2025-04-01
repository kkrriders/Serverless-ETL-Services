// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
process.env.OLLAMA_MODEL = 'mistral';
process.env.OLLAMA_MAX_TOKENS = '2048';
process.env.OLLAMA_TEMPERATURE = '0.5';
process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test;EndpointSuffix=core.windows.net';
process.env.AZURE_STORAGE_CONTAINER_NAME = 'test-container';
process.env.API_KEY = 'test-api-key';
process.env.ADMIN_API_KEY = 'test-admin-key';
process.env.REQUIRE_AUTH = 'false';

// Mock the logger to avoid console output during tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
  logRequest: jest.fn(),
  logError: jest.fn(),
}));

// Mock monitor functions to avoid metrics collection during tests
jest.mock('../src/utils/monitor', () => ({
  trackRequest: jest.fn(),
  trackError: jest.fn(),
  trackOllamaCall: jest.fn(),
  getHealthMetrics: jest.fn().mockReturnValue({ status: 'UP' }),
  getSystemInfo: jest.fn(),
  resetMetrics: jest.fn(),
}));

// Global test timeout
jest.setTimeout(30000);

// Global afterAll hook
afterAll(async () => {
  // Clean up resources if needed
}); 