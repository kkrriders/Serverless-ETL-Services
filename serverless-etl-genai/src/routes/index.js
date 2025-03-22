/**
 * Express routes for the ETL service
 */
const express = require('express');
const { extract } = require('../handlers/extractHandler');
const { transform } = require('../handlers/transformHandler');
const { load } = require('../handlers/loadHandler');
const { orchestrate } = require('../handlers/orchestratorHandler');
const { validateApiKey } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint (public)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Service is running' });
});

// Protected routes - require API key authentication
router.use('/extract', validateApiKey);
router.use('/transform', validateApiKey);
router.use('/load', validateApiKey);
router.use('/orchestrate', validateApiKey);

// Extract endpoint
router.post('/extract', async (req, res) => {
  const response = await extract({}, req);
  res.status(response.status).json(response.body);
});

// Transform endpoint
router.post('/transform', async (req, res) => {
  const response = await transform({}, req);
  res.status(response.status).json(response.body);
});

// Load endpoint
router.post('/load', async (req, res) => {
  const response = await load({}, req);
  res.status(response.status).json(response.body);
});

// Orchestrator endpoint
router.post('/orchestrate', async (req, res) => {
  const response = await orchestrate({}, req);
  res.status(response.status).json(response.body);
});

module.exports = router; 