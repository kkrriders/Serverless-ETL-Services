// Load environment variables from .env file
require('dotenv').config();

/**
 * Application configuration
 */
const config = {
  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  
  // Ollama configuration
  ollama: {
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
    model: process.env.OLLAMA_MODEL || 'mistral',
    maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '2048', 10),
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.5'),
  },
  
  // Azure Blob Storage configuration
  azureStorage: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'etl-data',
  },
  
  // Application configuration
  app: {
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    port: parseInt(process.env.PORT || '3000', 10),
    requireAuth: process.env.REQUIRE_AUTH === 'true'
  },
  
  // ETL configuration
  etl: {
    batchSize: parseInt(process.env.ETL_BATCH_SIZE || '100', 10),
    retryAttempts: parseInt(process.env.ETL_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.ETL_RETRY_DELAY || '1000', 10),
  },
};

/**
 * Validate the configuration
 * @returns {Array} Array of warning messages
 */
function validateConfig() {
  const warnings = [];
  
  // MongoDB validation
  if (!config.mongodb.uri) {
    warnings.push('MONGODB_URI environment variable is not set. Database features will be unavailable.');
  }
  
  // Azure Storage validation
  if (!config.azureStorage.connectionString) {
    warnings.push('AZURE_STORAGE_CONNECTION_STRING environment variable is not set. Blob storage features will be unavailable.');
  }
  
  // API key validation
  if (config.app.requireAuth && !process.env.API_KEY) {
    warnings.push('API_KEY environment variable is not set but authentication is required.');
  }
  
  // Log warnings
  const logger = require('../utils/logger');
  warnings.forEach(warning => logger.warn(warning));
  
  // Return warnings for testing/monitoring
  return warnings;
}

/**
 * Get a specific configuration value
 * @param {string} path - Dot notation path to the config value (e.g. 'ollama.model')
 * @param {any} defaultValue - Default value if path doesn't exist
 * @returns {any} Configuration value
 */
function get(path, defaultValue) {
  const parts = path.split('.');
  let current = config;
  
  for (const part of parts) {
    if (current && part in current) {
      current = current[part];
    } else {
      return defaultValue;
    }
  }
  
  return current !== undefined ? current : defaultValue;
}

module.exports = {
  config,
  validateConfig,
  get
}; 