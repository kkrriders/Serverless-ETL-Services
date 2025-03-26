/**
 * Express routes for the ETL service
 */
const express = require('express');
const path = require('path');
const { extract } = require('../handlers/extractHandler');
const { transform } = require('../handlers/transformHandler');
const { load } = require('../handlers/loadHandler');
const { orchestrate } = require('../handlers/orchestratorHandler');
const { validateApiKey } = require('../middleware/auth');
const { checkOllamaAvailability } = require('../utils/ollamaClient');

const router = express.Router();

// Root path - redirect to documentation
router.get('/', (req, res) => {
  res.redirect('/docs');
});

// Health check endpoint (public)
router.get('/health', async (req, res) => {
  // Check Ollama availability
  const ollamaAvailable = await checkOllamaAvailability();
  
  res.status(200).json({ 
    status: 'OK', 
    message: 'Service is running',
    ollama: ollamaAvailable ? 'available' : 'unavailable',
    timestamp: new Date().toISOString()
  });
});

// Protected routes - require API key authentication
router.use('/extract', validateApiKey);
router.use('/transform', validateApiKey);
router.use('/load', validateApiKey);
router.use('/orchestrate', validateApiKey);

// Extract endpoint
router.post('/extract', async (req, res, next) => {
  try {
    const response = await extract({}, req);
    res.status(response.status).json(response.body);
  } catch (error) {
    next(error);
  }
});

// Transform endpoint
router.post('/transform', async (req, res, next) => {
  try {
    const response = await transform({}, req);
    res.status(response.status).json(response.body);
  } catch (error) {
    next(error);
  }
});

// Load endpoint
router.post('/load', async (req, res, next) => {
  try {
    const response = await load({}, req);
    res.status(response.status).json(response.body);
  } catch (error) {
    next(error);
  }
});

// Orchestrator endpoint
router.post('/orchestrate', async (req, res, next) => {
  try {
    const response = await orchestrate({}, req);
    res.status(response.status).json(response.body);
  } catch (error) {
    next(error);
  }
});

// 404 handler - must be last
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.originalUrl}`,
    availableEndpoints: [
      'GET /health',
      'POST /extract',
      'POST /transform',
      'POST /load',
      'POST /orchestrate'
    ]
  });
});

module.exports = router; 