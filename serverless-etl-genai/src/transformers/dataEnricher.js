const logger = require('../utils/logger');
const { enrichData: enrichWithOpenAI } = require('../utils/openaiClient');

/**
 * Enrich data with additional information using GenAI
 * @param {Object|Array} data - The data to enrich
 * @param {Object} options - Enrichment options
 * @returns {Promise<Object|Array>} The enriched data
 */
async function enrichData(data, options = {}) {
  try {
    logger.info('Enriching data using GenAI...');
    
    const { fields, instruction, batchSize = 10 } = options;
    
    if (!instruction) {
      throw new Error('Enrichment instruction is required');
    }
    
    // Process an array of items
    if (Array.isArray(data)) {
      // Process in batches to avoid overwhelming the API
      const enrichedData = [];
      const batches = [];
      
      // Create batches
      for (let i = 0; i < data.length; i += batchSize) {
        batches.push(data.slice(i, i + batchSize));
      }
      
      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        logger.info(`Processing batch ${i + 1} of ${batches.length}...`);
        
        // Process items in parallel
        const batchPromises = batches[i].map(item => processItem(item, fields, instruction));
        const batchResults = await Promise.all(batchPromises);
        
        enrichedData.push(...batchResults);
      }
      
      logger.info(`Successfully enriched ${enrichedData.length} items`);
      return enrichedData;
    } 
    // Process a single item
    else if (typeof data === 'object' && data !== null) {
      const result = await processItem(data, fields, instruction);
      logger.info('Successfully enriched data');
      return result;
    }
    
    logger.warn('Data is not an object or array, returning original data');
    return data;
  } catch (error) {
    logger.error(`Error enriching data: ${error.message}`);
    // Return original data in case of error
    return data;
  }
}

/**
 * Process a single item for enrichment
 * @param {Object} item - The item to enrich
 * @param {Array<string>} fields - The fields to include in enrichment
 * @param {string} instruction - The enrichment instruction
 * @returns {Promise<Object>} The enriched item
 */
async function processItem(item, fields, instruction) {
  try {
    // Create a subset of the item with only the specified fields
    const subset = fields
      ? fields.reduce((obj, field) => {
          if (field in item) {
            obj[field] = item[field];
          }
          return obj;
        }, {})
      : item;
    
    // Enrich the subset
    const enrichedSubset = await enrichWithOpenAI(subset, instruction);
    
    // Merge the enriched subset with the original item
    return { ...item, ...enrichedSubset };
  } catch (error) {
    logger.error(`Error processing item for enrichment: ${error.message}`);
    return item;
  }
}

/**
 * Generate summaries for text fields
 * @param {Object|Array} data - The data to summarize
 * @param {Array<string>} textFields - The fields to summarize
 * @param {number} maxLength - Maximum summary length
 * @returns {Promise<Object|Array>} The data with summaries
 */
async function generateSummaries(data, textFields, maxLength = 100) {
  try {
    logger.info('Generating summaries...');
    
    if (!textFields || textFields.length === 0) {
      throw new Error('Text fields are required for summarization');
    }
    
    const instruction = `Summarize the following text in a concise and informative way. 
      Keep the summary to about ${maxLength} characters.`;
    
    if (Array.isArray(data)) {
      const summaries = await Promise.all(
        data.map(async (item) => {
          const result = { ...item };
          
          for (const field of textFields) {
            if (field in item && typeof item[field] === 'string' && item[field].length > maxLength) {
              const summary = await enrichWithOpenAI({ text: item[field] }, instruction);
              result[`${field}_summary`] = summary.summary || summary.text || item[field];
            }
          }
          
          return result;
        })
      );
      
      logger.info(`Generated summaries for ${summaries.length} items`);
      return summaries;
    } else if (typeof data === 'object' && data !== null) {
      const result = { ...data };
      
      for (const field of textFields) {
        if (field in data && typeof data[field] === 'string' && data[field].length > maxLength) {
          const summary = await enrichWithOpenAI({ text: data[field] }, instruction);
          result[`${field}_summary`] = summary.summary || summary.text || data[field];
        }
      }
      
      logger.info('Generated summaries');
      return result;
    }
    
    return data;
  } catch (error) {
    logger.error(`Error generating summaries: ${error.message}`);
    return data;
  }
}

/**
 * Categorize data using GenAI
 * @param {Object|Array} data - The data to categorize
 * @param {Array<string>} categories - The categories to assign
 * @param {string} textField - The field to use for categorization
 * @returns {Promise<Object|Array>} The categorized data
 */
async function categorizeData(data, categories, textField) {
  try {
    logger.info('Categorizing data...');
    
    if (!categories || categories.length === 0) {
      throw new Error('Categories are required for categorization');
    }
    
    if (!textField) {
      throw new Error('Text field is required for categorization');
    }
    
    const instruction = `
      Categorize the following text into one of these categories: ${categories.join(', ')}.
      Return ONLY the category name without any additional text or explanation.
    `;
    
    if (Array.isArray(data)) {
      const categorized = await Promise.all(
        data.map(async (item) => {
          if (textField in item && typeof item[textField] === 'string') {
            const result = { ...item };
            const categorization = await enrichWithOpenAI({ text: item[textField] }, instruction);
            
            // The model should return just the category name
            let category = categorization;
            if (typeof categorization === 'object') {
              category = categorization.category || Object.values(categorization)[0];
            }
            
            // Validate the category
            if (typeof category === 'string' && categories.includes(category.trim())) {
              result.category = category.trim();
            } else {
              result.category = 'Other';
            }
            
            return result;
          }
          
          return { ...item, category: 'Other' };
        })
      );
      
      logger.info(`Categorized ${categorized.length} items`);
      return categorized;
    } else if (typeof data === 'object' && data !== null) {
      if (textField in data && typeof data[textField] === 'string') {
        const result = { ...data };
        const categorization = await enrichWithOpenAI({ text: data[textField] }, instruction);
        
        // The model should return just the category name
        let category = categorization;
        if (typeof categorization === 'object') {
          category = categorization.category || Object.values(categorization)[0];
        }
        
        // Validate the category
        if (typeof category === 'string' && categories.includes(category.trim())) {
          result.category = category.trim();
        } else {
          result.category = 'Other';
        }
        
        logger.info('Categorized data');
        return result;
      }
      
      return { ...data, category: 'Other' };
    }
    
    return data;
  } catch (error) {
    logger.error(`Error categorizing data: ${error.message}`);
    return data;
  }
}

module.exports = {
  enrichData,
  generateSummaries,
  categorizeData,
}; 