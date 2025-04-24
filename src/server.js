/**
 * Express server for local development
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const routes = require('./routes');
const { validateConfig } = require('./config/config');
const { connectToDatabase } = require('./utils/db');
const { formatErrorResponse } = require('./utils/errorHandler');
const { checkOllamaAvailability } = require('./utils/ollamaClient');

// Load environment variables
require('dotenv').config();

// Initialize Express app
const app = express();

// Validate configuration
try {
  validateConfig();
} catch (error) {
  logger.warn(`Configuration validation warning: ${error.message}`);
  logger.info('Continuing with available configuration...');
}

// CORS configuration for Vercel frontend
const corsOptions = {
  origin: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3001', 'https://localhost:3001'], // Default or development origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Static files (if needed for documentation)
app.use('/docs', express.static(path.join(__dirname, '../docs')));

// Add routes
app.use('/', routes);

// Global error handler
app.use((err, req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`);
  const errorResponse = formatErrorResponse(err);
  res.status(errorResponse.status).json(errorResponse.body);
});

// Start the server
const PORT = 3000;
const MAX_RETRIES = 10; // Maximum number of ports to try

// Connect to database and start server
async function startServer() {
  try {
    // Connect to MongoDB if URI is provided
    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();
        logger.info('Connected to MongoDB');
      } catch (dbError) {
        logger.error(`Failed to connect to MongoDB: ${dbError.message}`);
        logger.info('Continuing without database connection...');
      }
    } else {
      logger.warn('MONGODB_URI not provided. Running without database connection');
    }

    // Check Ollama availability
    try {
      const available = await checkOllamaAvailability();
      if (available) {
        logger.info('Ollama service is available');
      } else {
        logger.warn('Ollama service is not available. Some functionality may be limited.');
      }
    } catch (error) {
      logger.warn(`Failed to check Ollama availability: ${error.message}`);
    }

    // Function to try listening on a port
    app.listen(PORT, () => {
      logger.info(`Server running at http://localhost:${PORT}`);
      logger.info('Available endpoints:');
      logger.info('  GET /health');
      logger.info('  POST /extract');
      logger.info('  POST /transform');
      logger.info('  POST /load');
      logger.info('  POST /orchestrate');
    });

  } catch (error) {
    // This catch block might be less likely to be hit now,
    // as errors during listen are handled by the server.on('error') handler.
    logger.error(`Failed to initiate server startup: ${error.message}`);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Enable graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app; 