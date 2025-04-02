#!/usr/bin/env node

/**
 * Local development server for testing serverless functions
 */

// Load environment variables
require('dotenv').config();

const http = require('http');
const { extractHandler, transformHandler, loadHandler, orchestratorHandler } = require('./src/handlers');
const logger = require('./src/utils/logger');

// Create a simple HTTP server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Parse request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const jsonBody = JSON.parse(body);
      let response;

      // Route to appropriate handler
      switch (path) {
        case '/extract':
          logger.info('Calling extract function');
          response = await extractHandler.extract({}, { body: jsonBody });
          break;

        case '/transform':
          logger.info('Calling transform function');
          response = await transformHandler.transform({}, { body: jsonBody });
          break;

        case '/load':
          logger.info('Calling load function');
          response = await loadHandler.load({}, { body: jsonBody });
          break;

        case '/orchestrate':
          logger.info('Calling orchestrate function');
          response = await orchestratorHandler.orchestrate({}, { body: jsonBody });
          break;

        default:
          response = {
            status: 404,
            body: { error: 'Not found' },
          };
      }

      // Set response status code and headers
      res.statusCode = response.status || 200;
      res.setHeader('Content-Type', 'application/json');
      
      // Send response
      res.end(JSON.stringify(response.body));
    } catch (error) {
      logger.error(`Error handling request: ${error.message}`);
      
      // Send error response
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message }));
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
  logger.info('Available endpoints:');
  logger.info('  POST /extract');
  logger.info('  POST /transform');
  logger.info('  POST /load');
  logger.info('  POST /orchestrate');
});

// Handle server errors
server.on('error', error => {
  logger.error(`Server error: ${error.message}`);
});

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Server shutting down');
  server.close(() => {
    process.exit(0);
  });
}); 