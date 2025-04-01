/**
 * Monitoring Utility
 * Module to track application performance and errors
 */
const logger = require('./logger');

// Store metrics in memory for simple implementation
const metrics = {
  errors: [],
  requests: [],
  operations: {},
  ollama: {
    successful: 0,
    failed: 0,
    totalTime: 0,
    avgTime: 0
  }
};

/**
 * Track an error occurrence
 * @param {Error} error - The error object
 * @param {string} source - Source of the error (component name)
 */
function trackError(error, source) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    source: source || 'unknown',
    status: error.status || 500,
    timestamp: new Date().toISOString()
  };
  
  metrics.errors.push(errorData);
  
  // Keep only the latest 100 errors
  if (metrics.errors.length > 100) {
    metrics.errors.shift();
  }
  
  // Log the error for immediate visibility
  logger.debug(`[MONITOR] Error tracked from ${source}: ${error.message}`);
}

/**
 * Track a request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in milliseconds
 */
function trackRequest(req, res, duration) {
  const requestData = {
    method: req.method,
    path: req.path,
    status: res.statusCode,
    duration,
    timestamp: new Date().toISOString()
  };
  
  metrics.requests.push(requestData);
  
  // Keep only the latest
  if (metrics.requests.length > 500) {
    metrics.requests.shift();
  }
}

/**
 * Track an operation's performance
 * @param {string} name - Name of the operation
 * @param {number} duration - Duration in milliseconds
 * @param {boolean} success - Whether the operation was successful
 */
function trackOperation(name, duration, success = true) {
  if (!metrics.operations[name]) {
    metrics.operations[name] = {
      count: 0,
      totalDuration: 0,
      failures: 0,
      successes: 0,
      avgDuration: 0
    };
  }
  
  const op = metrics.operations[name];
  op.count++;
  op.totalDuration += duration;
  op.avgDuration = op.totalDuration / op.count;
  
  if (success) {
    op.successes++;
  } else {
    op.failures++;
  }
}

/**
 * Track Ollama API call
 * @param {boolean} success - Whether the call was successful
 * @param {number} duration - The duration of the call in milliseconds
 */
function trackOllamaCall(success, duration) {
  if (success) {
    metrics.ollama.successful++;
  } else {
    metrics.ollama.failed++;
  }
  
  metrics.ollama.totalTime += duration;
  metrics.ollama.avgTime = metrics.ollama.totalTime / (metrics.ollama.successful + metrics.ollama.failed);
  
  // Also track as a general operation
  trackOperation('ollama', duration, success);
}

/**
 * Start timing an operation
 * @param {string} name - Name of the operation
 * @returns {Function} Function to call when operation completes
 */
function startTimer(name) {
  const startTime = Date.now();
  
  return (success = true) => {
    const duration = Date.now() - startTime;
    trackOperation(name, duration, success);
    return duration;
  };
}

/**
 * Get all collected metrics
 * @returns {Object} All metrics
 */
function getMetrics() {
  return {
    errors: metrics.errors.length,
    requests: metrics.requests.length,
    operations: Object.keys(metrics.operations).map(name => ({
      name,
      ...metrics.operations[name]
    })),
    timestamp: new Date().toISOString()
  };
}

/**
 * Get detailed error metrics
 * @returns {Array} Recent errors
 */
function getErrors() {
  return metrics.errors;
}

/**
 * Reset metrics (mainly for testing)
 */
function resetMetrics() {
  metrics.errors = [];
  metrics.requests = [];
  metrics.operations = {};
  metrics.ollama = {
    successful: 0,
    failed: 0,
    totalTime: 0,
    avgTime: 0
  };
}

/**
 * Get health metrics for the service
 * @returns {Object} Health metrics
 */
function getHealthMetrics() {
  const uptime = process.uptime();
  
  return {
    status: 'UP',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      formatted: formatUptime(uptime)
    },
    requests: {
      total: metrics.requests.length,
      recentErrors: metrics.errors.length
    },
    operations: Object.entries(metrics.operations).map(([name, data]) => ({
      name,
      count: data.count,
      successRate: data.count > 0 ? `${((data.successes / data.count) * 100).toFixed(2)}%` : '0%',
      avgDuration: `${Math.round(data.avgDuration)}ms`
    })),
    ollama: {
      calls: metrics.ollama.successful + metrics.ollama.failed,
      successful: metrics.ollama.successful,
      failed: metrics.ollama.failed,
      avgTime: `${Math.round(metrics.ollama.avgTime)}ms`,
      successRate: (metrics.ollama.successful + metrics.ollama.failed) > 0
        ? `${((metrics.ollama.successful / (metrics.ollama.successful + metrics.ollama.failed)) * 100).toFixed(2)}%`
        : '0%'
    }
  };
}

/**
 * Format uptime to a human-readable string
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

module.exports = {
  trackError,
  trackRequest,
  trackOperation,
  trackOllamaCall,
  startTimer,
  getMetrics,
  getErrors,
  resetMetrics,
  getHealthMetrics
}; 