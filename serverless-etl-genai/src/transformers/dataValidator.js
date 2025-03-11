const logger = require('../utils/logger');

/**
 * Validate data against a schema
 * @param {Object|Array} data - The data to validate
 * @param {Object} schema - The validation schema
 * @param {boolean} removeInvalid - Whether to remove invalid items (for arrays)
 * @returns {Object} Validation result
 */
function validateData(data, schema, removeInvalid = false) {
  try {
    logger.info('Validating data against schema...');
    
    if (!schema) {
      throw new Error('Validation schema is required');
    }
    
    // Validate an array of items
    if (Array.isArray(data)) {
      const validItems = [];
      const invalidItems = [];
      
      data.forEach((item, index) => {
        const { isValid, errors } = validateItem(item, schema);
        
        if (isValid) {
          validItems.push(item);
        } else {
          invalidItems.push({ item, index, errors });
        }
      });
      
      logger.info(`Validation completed: ${validItems.length} valid items, ${invalidItems.length} invalid items`);
      
      return {
        isValid: invalidItems.length === 0,
        validItems,
        invalidItems,
        data: removeInvalid ? validItems : data,
      };
    } 
    // Validate a single item
    else if (typeof data === 'object' && data !== null) {
      const { isValid, errors } = validateItem(data, schema);
      
      logger.info(`Validation completed: ${isValid ? 'Valid' : 'Invalid'}`);
      
      return {
        isValid,
        errors,
        data,
      };
    }
    
    logger.warn('Data is not an object or array');
    return {
      isValid: false,
      errors: ['Data must be an object or array'],
      data,
    };
  } catch (error) {
    logger.error(`Error validating data: ${error.message}`);
    return {
      isValid: false,
      errors: [error.message],
      data,
    };
  }
}

/**
 * Validate a single item against a schema
 * @param {Object} item - The item to validate
 * @param {Object} schema - The validation schema
 * @returns {Object} Validation result
 */
function validateItem(item, schema) {
  const errors = [];
  
  // Validate required fields
  if (schema.required) {
    schema.required.forEach(field => {
      if (!(field in item) || item[field] === undefined || item[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    });
  }
  
  // Validate field types and values
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([field, fieldSchema]) => {
      // Skip validation if the field doesn't exist (unless it's required)
      if (!(field in item)) {
        return;
      }
      
      const value = item[field];
      
      // Validate type
      if (fieldSchema.type && value !== undefined && value !== null) {
        let isValidType = false;
        
        switch (fieldSchema.type) {
          case 'string':
            isValidType = typeof value === 'string';
            break;
          case 'number':
            isValidType = typeof value === 'number';
            break;
          case 'boolean':
            isValidType = typeof value === 'boolean';
            break;
          case 'array':
            isValidType = Array.isArray(value);
            break;
          case 'object':
            isValidType = typeof value === 'object' && value !== null && !Array.isArray(value);
            break;
        }
        
        if (!isValidType) {
          errors.push(`Invalid type for field ${field}: expected ${fieldSchema.type}, got ${typeof value}`);
        }
      }
      
      // Validate enum
      if (fieldSchema.enum && value !== undefined && value !== null) {
        if (!fieldSchema.enum.includes(value)) {
          errors.push(`Invalid value for field ${field}: must be one of [${fieldSchema.enum.join(', ')}]`);
        }
      }
      
      // Validate min/max for numbers
      if (fieldSchema.type === 'number' && typeof value === 'number') {
        if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
          errors.push(`Invalid value for field ${field}: must be at least ${fieldSchema.minimum}`);
        }
        
        if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
          errors.push(`Invalid value for field ${field}: must be at most ${fieldSchema.maximum}`);
        }
      }
      
      // Validate min/max length for strings
      if (fieldSchema.type === 'string' && typeof value === 'string') {
        if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
          errors.push(`Invalid length for field ${field}: must be at least ${fieldSchema.minLength} characters`);
        }
        
        if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
          errors.push(`Invalid length for field ${field}: must be at most ${fieldSchema.maxLength} characters`);
        }
        
        // Validate pattern
        if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
          errors.push(`Invalid format for field ${field}: must match pattern ${fieldSchema.pattern}`);
        }
      }
      
      // Validate nested objects
      if (fieldSchema.type === 'object' && typeof value === 'object' && value !== null && fieldSchema.properties) {
        const nestedResult = validateItem(value, fieldSchema);
        
        if (!nestedResult.isValid) {
          errors.push(...nestedResult.errors.map(error => `In ${field}: ${error}`));
        }
      }
      
      // Validate arrays
      if (fieldSchema.type === 'array' && Array.isArray(value)) {
        if (fieldSchema.minItems !== undefined && value.length < fieldSchema.minItems) {
          errors.push(`Invalid length for field ${field}: must have at least ${fieldSchema.minItems} items`);
        }
        
        if (fieldSchema.maxItems !== undefined && value.length > fieldSchema.maxItems) {
          errors.push(`Invalid length for field ${field}: must have at most ${fieldSchema.maxItems} items`);
        }
        
        // Validate array items
        if (fieldSchema.items && value.length > 0) {
          value.forEach((item, index) => {
            // Validate item type
            if (fieldSchema.items.type) {
              let isValidType = false;
              
              switch (fieldSchema.items.type) {
                case 'string':
                  isValidType = typeof item === 'string';
                  break;
                case 'number':
                  isValidType = typeof item === 'number';
                  break;
                case 'boolean':
                  isValidType = typeof item === 'boolean';
                  break;
                case 'array':
                  isValidType = Array.isArray(item);
                  break;
                case 'object':
                  isValidType = typeof item === 'object' && item !== null && !Array.isArray(item);
                  break;
              }
              
              if (!isValidType) {
                errors.push(`Invalid type for item ${index} in field ${field}: expected ${fieldSchema.items.type}, got ${typeof item}`);
              }
            }
            
            // Validate object items
            if (fieldSchema.items.type === 'object' && typeof item === 'object' && item !== null && fieldSchema.items.properties) {
              const nestedResult = validateItem(item, fieldSchema.items);
              
              if (!nestedResult.isValid) {
                errors.push(...nestedResult.errors.map(error => `In ${field}[${index}]: ${error}`));
              }
            }
          });
        }
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateData,
}; 