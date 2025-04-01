/**
 * Express routes for the ETL service
 */
const express = require('express');
const path = require('path');
const { extract } = require('../handlers/extractHandler');
const { transform } = require('../handlers/transformHandler');
const { load } = require('../handlers/loadHandler');
const { orchestrate } = require('../handlers/orchestratorHandler');
const { validateApiKey, limiter } = require('../middleware/auth');
const { checkOllamaAvailability } = require('../utils/ollamaClient');
const { catchAsync } = require('../utils/errorHandler');
const monitor = require('../utils/monitor');
const logger = require('../utils/logger');

const router = express.Router();

// Request tracking middleware
router.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    monitor.trackRequest(req, res, startTime);
  });
  next();
});

// Root path - redirect to documentation
router.get('/', (req, res) => {
  res.redirect('/docs');
});

// Health check endpoint (public)
router.get('/health', catchAsync(async (req, res) => {
  // Check Ollama availability
  const ollamaAvailable = await checkOllamaAvailability();
  
  res.status(200).json({ 
    status: 'OK', 
    message: 'Service is running',
    ollama: ollamaAvailable ? 'available' : 'unavailable',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
}));

// Metrics endpoint (protected)
router.get('/metrics', validateApiKey, (req, res) => {
  const metrics = monitor.getHealthMetrics();
  res.status(200).json(metrics);
});

// Protected routes with rate limiting and authentication
router.use(limiter);
router.use(validateApiKey);

// Extract endpoint
router.post('/extract', catchAsync(async (req, res) => {
  logger.info('Processing extract request');
  const result = await extract({}, req);
  res.status(result.status).json(result.body);
}));

// Transform endpoint
router.post('/transform', catchAsync(async (req, res) => {
  logger.info('Processing transform request');
  const result = await transform({}, req);
  res.status(result.status).json(result.body);
}));

// Load endpoint
router.post('/load', catchAsync(async (req, res) => {
  logger.info('Processing load request');
  const result = await load({}, req);
  res.status(result.status).json(result.body);
}));

// Orchestrate endpoint
router.post('/orchestrate', catchAsync(async (req, res) => {
  logger.info('Processing orchestrate request');
  const result = await orchestrate({}, req);
  res.status(result.status).json(result.body);
}));

// Reset metrics endpoint (admin only)
router.post('/admin/reset-metrics', validateApiKey, (req, res) => {
  // Extra validation to ensure only admins can reset metrics
  if (req.headers['x-admin-key'] !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin API key required'
    });
  }
  
  monitor.resetMetrics();
  res.status(200).json({
    success: true,
    message: 'Metrics reset successfully'
  });
});

// 404 handler - must be last
router.use('*', (req, res) => {
  logger.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.originalUrl}`,
    availableEndpoints: [
      'GET /health',
      'GET /metrics',
      'POST /extract',
      'POST /transform',
      'POST /load',
      'POST /orchestrate'
    ]
  });
});

module.exports = router; 