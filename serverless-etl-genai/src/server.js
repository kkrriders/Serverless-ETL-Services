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

// Middleware
app.use(cors());

// JSON parsing with error handling
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid JSON payload',
        message: e.message 
      });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true }));

// Static files (if needed for documentation)
app.use('/docs', express.static(path.join(__dirname, '../docs')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Add routes
app.use('/', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  
  // Don't send error details in production
  const errorDetails = process.env.NODE_ENV === 'production' 
    ? 'An error occurred processing your request' 
    : err.message;
  
  res.status(err.status || 500).json({
    success: false,
    error: errorDetails
  });
});

// Start the server
const PORT = process.env.PORT || 3000;

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

    // Start the Express server
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
    logger.error(`Failed to start server: ${error.message}`);
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