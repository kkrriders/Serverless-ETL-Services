const logger = require('../utils/logger');

/**
 * Clean data by removing null, undefined, and empty values
 * @param {Object|Array} data - The data to clean
 * @returns {Object|Array} The cleaned data
 */
function removeEmptyValues(data) {
  if (Array.isArray(data)) {
    return data.filter(item => item !== null && item !== undefined)
      .map(item => {
        if (typeof item === 'object' && item !== null) {
          return removeEmptyValues(item);
        }
        return item;
      });
  } else if (typeof data === 'object' && data !== null) {
    const result = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          result[key] = removeEmptyValues(value);
        } else {
          result[key] = value;
        }
      }
    });
    
    return result;
  }
  
  return data;
}

/**
 * Standardize date formats
 * @param {Object|Array} data - The data to process
 * @param {Array<string>} dateFields - The fields to standardize as dates
 * @param {string} dateFormat - The target date format (ISO by default)
 * @returns {Object|Array} The data with standardized dates
 */
function standardizeDates(data, dateFields, dateFormat = 'ISO') {
  if (!dateFields || dateFields.length === 0) {
    return data;
  }

  const processValue = (item) => {
    if (typeof item !== 'object' || item === null) {
      return item;
    }
    
    const result = Array.isArray(item) ? [...item] : { ...item };
    
    for (const field of dateFields) {
      if (field in result && result[field]) {
        try {
          const date = new Date(result[field]);
          if (!isNaN(date.getTime())) {
            if (dateFormat === 'ISO') {
              result[field] = date.toISOString();
            } else if (dateFormat === 'YYYY-MM-DD') {
              result[field] = date.toISOString().split('T')[0];
            }
          }
        } catch (error) {
          logger.warn(`Failed to standardize date for field ${field}: ${error.message}`);
        }
      }
    }
    
    // Process nested objects
    for (const key in result) {
      if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = standardizeDates(result[key], dateFields, dateFormat);
      }
    }
    
    return result;
  };
  
  if (Array.isArray(data)) {
    return data.map(processValue);
  }
  
  return processValue(data);
}

/**
 * Clean text fields by trimming, lowercasing, etc.
 * @param {Object|Array} data - The data to process
 * @param {Array<string>} textFields - The fields to clean
 * @param {Object} options - Text cleaning options
 * @param {boolean} options.trim - Whether to trim whitespace
 * @param {boolean} options.lowercase - Whether to convert to lowercase
 * @param {boolean} options.removeSpecialChars - Whether to remove special characters
 * @returns {Object|Array} The data with cleaned text
 */
function cleanTextFields(data, textFields, options = {}) {
  const { trim = true, lowercase = false, removeSpecialChars = false } = options;
  
  if (!textFields || textFields.length === 0) {
    return data;
  }

  const processValue = (item) => {
    if (typeof item !== 'object' || item === null) {
      return item;
    }
    
    const result = Array.isArray(item) ? [...item] : { ...item };
    
    for (const field of textFields) {
      if (field in result && typeof result[field] === 'string') {
        let value = result[field];
        
        if (trim) {
          value = value.trim();
        }
        
        if (lowercase) {
          value = value.toLowerCase();
        }
        
        if (removeSpecialChars) {
          value = value.replace(/[^\w\s]/gi, '');
        }
        
        result[field] = value;
      }
    }
    
    // Process nested objects
    for (const key in result) {
      if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = cleanTextFields(result[key], textFields, options);
      }
    }
    
    return result;
  };
  
  if (Array.isArray(data)) {
    return data.map(processValue);
  }
  
  return processValue(data);
}

/**
 * Clean data by applying multiple transformations
 * @param {Object|Array} data - The data to clean
 * @param {Object} options - Cleaning options
 * @returns {Object|Array} The cleaned data
 */
function cleanData(data, options = {}) {
  try {
    logger.info('Cleaning data...');
    
    const {
      removeEmpty = true,
      dateFields = [],
      dateFormat = 'ISO',
      textFields = [],
      textOptions = {},
    } = options;
    
    let result = data;
    
    if (removeEmpty) {
      result = removeEmptyValues(result);
    }
    
    if (dateFields.length > 0) {
      result = standardizeDates(result, dateFields, dateFormat);
    }
    
    if (textFields.length > 0) {
      result = cleanTextFields(result, textFields, textOptions);
    }
    
    logger.info('Data cleaning completed');
    
    return result;
  } catch (error) {
    logger.error(`Error cleaning data: ${error.message}`);
    throw error;
  }
}

module.exports = {
  cleanData,
  removeEmptyValues,
  standardizeDates,
  cleanTextFields,
}; 