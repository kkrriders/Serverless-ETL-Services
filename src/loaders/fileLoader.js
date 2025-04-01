/**
 * File Loader
 * Module to load data to various file formats
 */
const fs = require('fs').promises;
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');
const monitor = require('../utils/monitor');

/**
 * Load data to a file
 * @param {Object} data - Data to load
 * @param {Object} destination - Destination configuration
 * @returns {Promise<Object>} Result of the load operation
 */
async function loadToFile(data, destination) {
  const startTime = Date.now();
  
  try {
    if (!destination.path) {
      throw new AppError('File destination must include a path', 400);
    }

    if (!Array.isArray(data)) {
      data = [data];
    }

    const filePath = path.resolve(destination.path);
    const fileFormat = destination.format || path.extname(filePath).slice(1).toLowerCase();
    const dirPath = path.dirname(filePath);
    
    logger.info(`Loading data to file: ${filePath} (${fileFormat})`);

    // Ensure directory exists
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new AppError(`Failed to create directory: ${error.message}`, 500);
    }

    let result;

    // Process file based on format
    switch (fileFormat) {
      case 'json':
        try {
          const jsonContent = JSON.stringify(data, null, 2);
          await fs.writeFile(filePath, jsonContent, 'utf8');
          result = { path: filePath, format: fileFormat, count: data.length };
        } catch (error) {
          throw new AppError(`Failed to write JSON file: ${error.message}`, 500);
        }
        break;
        
      case 'csv':
        try {
          result = await writeCSV(data, filePath);
        } catch (error) {
          throw new AppError(`Failed to write CSV file: ${error.message}`, 500);
        }
        break;
        
      case 'txt':
        try {
          const textContent = data.map(item => 
            typeof item === 'string' ? item : JSON.stringify(item)
          ).join('\n');
          await fs.writeFile(filePath, textContent, 'utf8');
          result = { path: filePath, format: fileFormat, count: data.length };
        } catch (error) {
          throw new AppError(`Failed to write text file: ${error.message}`, 500);
        }
        break;
        
      default:
        throw new AppError(`Unsupported file format: ${fileFormat}`, 400);
    }

    const duration = Date.now() - startTime;
    logger.info(`File load completed in ${duration}ms: ${data.length} records written to ${filePath}`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`File load failed in ${duration}ms: ${error.message}`);
    
    // Track error
    monitor.trackError(error, 'fileLoader');
    
    if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError(`File load failed: ${error.message}`, 500);
    }
  }
}

/**
 * Write data to CSV file
 * @param {Array} data - Data to write
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Object>} Result of the write operation
 */
async function writeCSV(data, filePath) {
  return new Promise((resolve, reject) => {
    if (data.length === 0) {
      return resolve({ path: filePath, format: 'csv', count: 0 });
    }

    // Get all possible headers from all objects
    const headers = Array.from(
      new Set(
        data.reduce((allKeys, obj) => {
          return allKeys.concat(Object.keys(obj));
        }, [])
      )
    ).map(key => ({ id: key, title: key }));

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers
    });

    csvWriter.writeRecords(data)
      .then(() => {
        resolve({ path: filePath, format: 'csv', count: data.length });
      })
      .catch(error => {
        reject(error);
      });
  });
}

module.exports = {
  loadToFile
}; 