/**
 * File Extractor
 * Module to extract data from various file types
 */
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { Readable } = require('stream');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');
const monitor = require('../utils/monitor');

/**
 * Extract data from a file
 * @param {Object} source - Source configuration
 * @returns {Promise<Array>} Extracted data
 */
async function extractFromFile(source) {
  const startTime = Date.now();
  
  try {
    if (!source.path) {
      throw new AppError('File source must include a path', 400);
    }

    const filePath = path.resolve(source.path);
    const fileFormat = source.format || path.extname(filePath).slice(1).toLowerCase();
    
    logger.info(`Extracting data from file: ${filePath} (${fileFormat})`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new AppError(`File does not exist or cannot be accessed: ${filePath}`, 404);
    }

    // Read file content
    const fileContent = await fs.readFile(filePath, 'utf8');
    let data;

    // Process file based on format
    switch (fileFormat) {
      case 'json':
        try {
          data = JSON.parse(fileContent);
          // Convert to array if it's an object
          if (!Array.isArray(data)) {
            data = [data];
          }
        } catch (error) {
          throw new AppError(`Invalid JSON format: ${error.message}`, 400);
        }
        break;
        
      case 'csv':
        data = await parseCSV(fileContent);
        break;
        
      case 'txt':
        data = fileContent.split('\n')
          .filter(line => line.trim())
          .map(line => ({ content: line }));
        break;
        
      default:
        throw new AppError(`Unsupported file format: ${fileFormat}`, 400);
    }

    const duration = Date.now() - startTime;
    logger.info(`File extraction completed in ${duration}ms: ${Array.isArray(data) ? data.length : 1} records`);
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`File extraction failed in ${duration}ms: ${error.message}`);
    
    // Track error
    monitor.trackError(error, 'fileExtractor');
    
    if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError(`File extraction failed: ${error.message}`, 500);
    }
  }
}

/**
 * Parse CSV content to JSON
 * @param {string} content - CSV content
 * @returns {Promise<Array>} Parsed data
 */
function parseCSV(content) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    Readable.from(content)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(new AppError(`CSV parsing error: ${error.message}`, 400)));
  });
}

module.exports = {
  extractFromFile
}; 