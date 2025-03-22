/**
 * Express server for local development
 */
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const routes = require('./routes');
const { validateConfig } = require('./config/config');
const { connectToDatabase } = require('./utils/db');

// Load environment variables
require('dotenv').config();

// Initialize Express app
const app = express();

// Validate configuration
validateConfig();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  res.status(err.status || 500).json({
    success: false,
    error: err.message,
  });
});

// Start the server
const PORT = process.env.PORT || 3000;

// Connect to database and start server
async function startServer() {
  try {
    // Connect to MongoDB if URI is provided
    if (process.env.MONGODB_URI) {
      await connectToDatabase();
      logger.info('Connected to MongoDB');
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

module.exports = app; 