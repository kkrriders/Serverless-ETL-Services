/**
 * File Utility Functions
 */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify/sync');
const logger = require('./logger');
const { AppError } = require('./errorHandler');

/**
 * Read a JSON file
 * @param {string} filePath - The path to the file
 * @returns {Promise<Object>} The parsed JSON data
 */
async function readJsonFile(filePath) {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error reading JSON file ${filePath}: ${error.message}`);
    throw new AppError(`Failed to read JSON file: ${error.message}`, 500);
  }
}

/**
 * Write data to a JSON file
 * @param {string} filePath - The path to write the file
 * @param {Object} data - The data to write
 * @param {boolean} [pretty=true] - Whether to format the JSON output
 * @returns {Promise<void>}
 */
async function writeJsonFile(filePath, data, pretty = true) {
  try {
    const dirPath = path.dirname(filePath);
    
    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    
    const jsonData = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await fs.promises.writeFile(filePath, jsonData, 'utf8');
    logger.info(`JSON file written to ${filePath}`);
  } catch (error) {
    logger.error(`Error writing JSON file ${filePath}: ${error.message}`);
    throw new AppError(`Failed to write JSON file: ${error.message}`, 500);
  }
}

/**
 * Read a CSV file
 * @param {string} filePath - The path to the file
 * @param {Object} [options] - Options for csv-parser
 * @returns {Promise<Array>} Array of rows from the CSV
 */
async function readCsvFile(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .on('error', (error) => {
        logger.error(`Error reading CSV file ${filePath}: ${error.message}`);
        reject(new AppError(`Failed to read CSV file: ${error.message}`, 500));
      })
      .pipe(csv(options))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => {
        logger.error(`Error parsing CSV file ${filePath}: ${error.message}`);
        reject(new AppError(`Failed to parse CSV file: ${error.message}`, 500));
      });
  });
}

/**
 * Write data to a CSV file
 * @param {string} filePath - The path to write the file
 * @param {Array} data - Array of objects to write
 * @param {Object} [options] - Options for csv-stringify
 * @returns {Promise<void>}
 */
async function writeCsvFile(filePath, data, options = {}) {
  try {
    const dirPath = path.dirname(filePath);
    
    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    
    const csvData = stringify(data, {
      header: true,
      ...options
    });
    
    await fs.promises.writeFile(filePath, csvData, 'utf8');
    logger.info(`CSV file written to ${filePath}`);
  } catch (error) {
    logger.error(`Error writing CSV file ${filePath}: ${error.message}`);
    throw new AppError(`Failed to write CSV file: ${error.message}`, 500);
  }
}

/**
 * Create temp directory if it doesn't exist
 * @param {string} dirPath - The directory path to create
 * @returns {Promise<string>} The created directory path
 */
async function ensureTempDir(dirPath = path.join(process.cwd(), 'temp')) {
  try {
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    return dirPath;
  } catch (error) {
    logger.error(`Error creating temp directory ${dirPath}: ${error.message}`);
    throw new AppError(`Failed to create temp directory: ${error.message}`, 500);
  }
}

/**
 * Clean up temporary files
 * @param {string} filePath - Path to file or directory to delete
 * @returns {Promise<void>}
 */
async function cleanupTempFiles(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = await fs.promises.stat(filePath);
      
      if (stats.isDirectory()) {
        const files = await fs.promises.readdir(filePath);
        for (const file of files) {
          await cleanupTempFiles(path.join(filePath, file));
        }
        await fs.promises.rmdir(filePath);
      } else {
        await fs.promises.unlink(filePath);
      }
    }
  } catch (error) {
    logger.warn(`Error cleaning up temp file ${filePath}: ${error.message}`);
    // Don't throw the error, just log it
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile,
  readCsvFile,
  writeCsvFile,
  ensureTempDir,
  cleanupTempFiles
}; 