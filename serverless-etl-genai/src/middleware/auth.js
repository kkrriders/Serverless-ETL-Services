/**
 * Authentication middleware
 * This is a simple API key authentication middleware
 * In a production environment, you would use a more secure authentication method
 */
const logger = require('../utils/logger');
const { config } = require('../config/config');

/**
 * Verify the API key in the request headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateApiKey(req, res, next) {
  try {
    // Skip authentication in development mode
    if (process.env.NODE_ENV === 'development' && !process.env.REQUIRE_AUTH) {
      return next();
    }

    // Get the API key from the request headers
    const apiKey = req.headers['x-api-key'];

    // Check if the API key is provided
    if (!apiKey) {
      logger.warn('API key missing');
      return res.status(401).json({
        success: false,
        error: 'API key is required',
      });
    }

    // Validate the API key
    // In a real application, you would validate against a database or secret store
    if (apiKey !== process.env.API_KEY) {
      logger.warn('Invalid API key');
      return res.status(403).json({
        success: false,
        error: 'Invalid API key',
      });
    }

    // API key is valid, proceed to the next middleware
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
}

module.exports = {
  validateApiKey,
}; 