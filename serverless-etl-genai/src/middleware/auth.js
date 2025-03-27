/**
 * Authentication middleware
 * This is a simple API key authentication middleware
 * In a production environment, you would use a more secure authentication method
 */
const logger = require('../utils/logger');
const { config } = require('../config/config');
const rateLimit = require('express-rate-limit');

// Create rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

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

    // Compare API keys using timing-safe comparison
    const isValid = timingSafeEqual(apiKey, configuredApiKey);
    
    if (!isValid) {
      logger.warn(`Invalid API key attempt - ${req.method} ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'The provided API key is invalid'
      });
    }

    // Add API key info to request for logging
    req.apiKeyInfo = {
      key: apiKey.substring(0, 4) + '...', // Only log first 4 chars
      timestamp: new Date().toISOString()
    };

    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
}

/**
 * Timing-safe string comparison
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {boolean} True if strings are equal
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

module.exports = {
  validateApiKey,
  limiter
}; 