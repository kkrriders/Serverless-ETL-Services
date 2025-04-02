/**
 * API Extractor
 * Module to extract data from APIs
 */
const axios = require('axios');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');
const monitor = require('../utils/monitor');

/**
 * Extract data from an API endpoint
 * @param {Object} source - Source configuration
 * @returns {Promise<any>} - Extracted data
 */
async function extractFromApi(source) {
  const startTime = Date.now();
  
  try {
    if (!source.url) {
      throw new AppError('API source must include a URL', 400);
    }

    const method = source.method || 'GET';
    const headers = source.headers || {};
    const data = source.data || null;
    const params = source.params || null;
    const timeout = source.timeout || 30000;

    logger.info(`Extracting data from API: ${method} ${source.url}`);

    const response = await axios({
      method,
      url: source.url,
      headers,
      data,
      params,
      timeout,
      validateStatus: status => status >= 200 && status < 300,
    });

    const duration = Date.now() - startTime;
    logger.info(`API extraction completed in ${duration}ms`);

    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`API extraction failed in ${duration}ms: ${error.message}`);
    
    // Track error
    monitor.trackError(error, 'apiExtractor');
    
    if (error.response) {
      throw new AppError(
        `API request failed with status ${error.response.status}: ${error.response.statusText}`,
        400,
        {
          url: source.url,
          statusCode: error.response.status,
          data: error.response.data,
        },
      );
    } else if (error.request) {
      throw new AppError(
        `API request failed to receive a response: ${error.message}`,
        500,
        { url: source.url },
      );
    } else if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError(`API request failed: ${error.message}`, 500);
    }
  }
}

/**
 * Extract data from an API with pagination
 * @param {Object} options - API extraction options
 * @param {string} options.url - API URL
 * @param {string} options.method - HTTP method (GET, POST, etc.)
 * @param {Object} options.headers - Request headers
 * @param {Object} options.params - Query parameters
 * @param {Function} options.getNextPageParams - Function to get the next page parameters
 * @param {Function} options.hasMorePages - Function to check if there are more pages
 * @param {number} options.maxPages - Maximum number of pages to fetch (default: 10)
 * @returns {Promise<Array<Object>>} The extracted data from all pages
 */
async function extractFromApiWithPagination(options) {
  try {
    const {
      url,
      method = 'GET',
      headers = {},
      params = {},
      getNextPageParams,
      hasMorePages,
      maxPages = 10,
    } = options;

    if (!url) {
      throw new Error('API URL is required');
    }

    if (!getNextPageParams || !hasMorePages) {
      throw new Error('Pagination functions are required');
    }

    logger.info(`Extracting data from API with pagination: ${url}`);

    let currentParams = { ...params };
    let currentPage = 1;
    let allData = [];
    let hasMore = true;

    while (hasMore && currentPage <= maxPages) {
      logger.info(`Fetching page ${currentPage} from API: ${url}`);

      // Make the API request
      const response = await axios({
        url,
        method,
        headers,
        params: currentParams,
      });

      // Check if response data exists
      if (response.data) {
        // Add the current page data to the result
        allData = [...allData, ...(Array.isArray(response.data) ? response.data : [response.data])];

        // Check if there are more pages
        hasMore = hasMorePages(response.data);

        if (hasMore) {
          // Get the parameters for the next page
          currentParams = getNextPageParams(response.data, currentParams);
          currentPage++;
        }
      } else {
        hasMore = false;
      }
    }

    logger.info(`Successfully extracted ${allData.length} items from API with pagination: ${url}`);

    return allData;
  } catch (error) {
    logger.error(`Error extracting data from API with pagination: ${error.message}`);
    throw error;
  }
}

module.exports = {
  extractFromApi,
  extractFromApiWithPagination,
}; 