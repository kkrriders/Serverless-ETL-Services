const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }), // Include stack traces for errors
  winston.format.colorize({ all: true }),
  winston.format.printf(
    info => {
      const { timestamp, level, message, stack, ...meta } = info;
      let logMessage = `${timestamp} ${level}: ${message}`;
      
      // Add stack trace if present
      if (stack) {
        logMessage += `\n${stack}`;
      }
      
      // Add metadata if present
      if (Object.keys(meta).length > 0) {
        logMessage += `\n${JSON.stringify(meta, null, 2)}`;
      }
      
      return logMessage;
    },
  ),
);

// Define which transports the logger should use
const transports = [
  // Console transport for all logs
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
  
  // File transport for error logs with rotation
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true,
  }),
  
  // File transport for all logs with rotation
  new winston.transports.File({
    filename: path.join(logsDir, 'all.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
  // Don't exit on error
  exitOnError: false,
});

// Add request logging helper
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
  
  if (res.statusCode >= 400) {
    logger.error('Request failed', logData);
  } else {
    logger.http('Request completed', logData);
  }
};

// Add error logging helper
logger.logError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    ...context,
  };
  
  logger.error('Error occurred', errorData);
};

module.exports = logger; 