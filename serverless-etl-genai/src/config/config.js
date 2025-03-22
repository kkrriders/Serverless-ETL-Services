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
 * @throws {Error} If required configuration is missing
 */
function validateConfig() {
  // MongoDB validation
  if (!config.mongodb.uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  
  // Validate Ollama model
  if (!config.ollama.model) {
    throw new Error('OLLAMA_MODEL environment variable is required');
  }
  
  // Azure Storage validation
  if (!config.azureStorage.connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is required');
  }
}

module.exports = {
  config,
  validateConfig,
}; 