const logger = require('./logger');

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  /**
   * Create an application error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true; // Indicates if this is an operational error that we can handle
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Format an error response
 * @param {Error} error - The error to format
 * @returns {Object} Formatted error response with status and body
 */
function formatErrorResponse(error) {
  // Determine if this is an operational error
  const isOperational = error instanceof AppError;
  
  // Log the error
  if (isOperational) {
    logger.warn(`Operational error: ${error.message}`);
  } else {
    logger.error(`Unhandled error: ${error.message}`, { stack: error.stack });
  }
  
  const statusCode = error.statusCode || 500;
  
  // Create the base error response
  const errorResponse = {
    status: statusCode,
    body: {
      success: false,
      error: {
        message: error.message || 'An unexpected error occurred',
        status: statusCode,
        timestamp: error.timestamp || new Date().toISOString(),
      },
    },
  };
  
  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorResponse.body.error.stack = error.stack;
  }
  
  // Add details if available
  if (error.details) {
    errorResponse.body.error.details = error.details;
  }
  
  return errorResponse;
}

/**
 * Async function error wrapper
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Wrapped function that handles errors
 */
function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle promise rejection with specific error handling
 * @param {Promise} promise - The promise to handle
 * @param {Function} errorHandler - Custom error handler
 * @returns {Promise} Promise that resolves to [data, error]
 */
async function handlePromise(promise, errorHandler) {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    if (errorHandler) {
      return [null, errorHandler(error)];
    }
    return [null, error];
  }
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Promise that resolves to the function result
 */
async function retry(fn, options = {}) {
  const {
    retries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry = null,
  } = options;
  
  let attempts = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempts++;
      
      if (attempts >= retries) {
        throw error;
      }
      
      delay = Math.min(delay * factor, maxDelay);
      
      if (onRetry) {
        onRetry(error, attempts, delay);
      }
      
      logger.warn(`Retrying operation after error: ${error.message}. Attempt ${attempts} of ${retries}. Waiting ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Global error handler middleware for Express
 * @param {Error} err - The error that occurred
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, _next) {
  // Format the error response
  const errorResponse = formatErrorResponse(err);
  
  // Log the error
  const logLevel = err instanceof AppError && err.statusCode < 500 ? 'warn' : 'error';
  logger[logLevel](`Error in route ${req.method} ${req.originalUrl}: ${err.message}`);
  
  // Send the error response
  res.status(errorResponse.status).json(errorResponse.body);
}

module.exports = {
  AppError,
  formatErrorResponse,
  catchAsync,
  handlePromise,
  retry,
  errorHandler,
}; 