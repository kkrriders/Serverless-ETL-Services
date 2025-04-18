/**
 * Main application file for the Serverless ETL Service
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { auth } = require('./middleware/auth');
const config = require('./config/config');
const routes = require('./routes');
const logger = require('./utils/logger');
const { AppError, errorHandler } = require('./utils/errorHandler');
const monitor = require('./utils/monitor');

// Create Express app
const app = express();

// Add monitoring for requests
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Once the response is finished, log the request details
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    monitor.trackRequest(req, res, duration);
  });
  
  next();
});

// Add request logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Add CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow requests from both 3000 (backend) and 3001 (dashboard)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
  credentials: true,
}));

// Add JSON body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from docs directory
app.use('/docs', express.static(path.join(__dirname, '../docs')));

// Add authentication middleware if required
if (config.get('auth.required') === true) {
  app.use(auth);
}

// Register routes
app.use('/', routes);

// Handle 404 errors
app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// Global error handler
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('UNCAUGHT EXCEPTION:', error);
  monitor.trackError(error, 'uncaughtException');
  
  // Exit with error
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, _promise) => {
  logger.error('UNHANDLED REJECTION:', reason);
  monitor.trackError(reason instanceof Error ? reason : new Error(String(reason)), 'unhandledRejection');
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  process.exit(0);
});

// Handle SIGINT signal
process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully');
  process.exit(0);
});

module.exports = app; 