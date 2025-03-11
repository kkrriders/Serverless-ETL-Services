const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Extract data from an API
 * @param {Object} options - API extraction options
 * @param {string} options.url - API URL
 * @param {string} options.method - HTTP method (GET, POST, etc.)
 * @param {Object} options.headers - Request headers
 * @param {Object} options.params - Query parameters
 * @param {Object} options.data - Request body data (for POST, PUT, etc.)
 * @param {number} options.timeout - Request timeout in milliseconds
 * @returns {Promise<Object>} The extracted data
 */
async function extractFromApi(options) {
  try {
    const { url, method = 'GET', headers = {}, params = {}, data = {}, timeout = 10000 } = options;

    if (!url) {
      throw new Error('API URL is required');
    }

    logger.info(`Extracting data from API: ${url}`);

    // Make the API request
    const response = await axios({
      url,
      method,
      headers,
      params,
      data,
      timeout,
    });

    logger.info(`Successfully extracted data from API: ${url}`);

    return {
      data: response.data,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    logger.error(`Error extracting data from API: ${error.message}`);
    
    // Return error details
    return {
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
    };
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