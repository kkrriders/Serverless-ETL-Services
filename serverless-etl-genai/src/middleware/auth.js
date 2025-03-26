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
    // Skip authentication in development mode if specified
    if (process.env.NODE_ENV === 'development' && process.env.REQUIRE_AUTH !== 'true') {
      logger.debug('Authentication skipped in development mode');
      return next();
    }

    // Get the API key from the request headers
    // We accept both 'x-api-key' and 'authorization' headers
    const apiKey = req.headers['x-api-key'] || 
                  (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                    ? req.headers.authorization.split(' ')[1] 
                    : null);

    // Check if the API key is provided
    if (!apiKey) {
      logger.warn(`API key missing - ${req.method} ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide an API key using the X-API-Key header'
      });
    }

    // Validate the API key
    // In a real application, you would validate against a database or secret store
    const configuredApiKey = process.env.API_KEY;
    
    if (!configuredApiKey) {
      logger.error('API_KEY environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'Authentication configuration error'
      });
    }
    
    if (apiKey !== configuredApiKey) {
      logger.warn(`Invalid API key used - ${req.method} ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    // API key is valid, proceed to the next middleware
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  validateApiKey,
}; 