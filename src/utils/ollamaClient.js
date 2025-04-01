const axios = require('axios');
const logger = require('./logger');
const { config } = require('../config/config');
const { AppError } = require('./errorHandler');
const monitor = require('./monitor');

/**
 * Check if Ollama is available
 * @returns {Promise<boolean>} True if Ollama is available, false otherwise
 */
async function checkOllamaAvailability() {
  const startTime = Date.now();
  
  try {
    // Use environment variable directly instead of config.get
    const endpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api';
    if (!endpoint) {
      logger.warn('Ollama endpoint not configured');
      return false;
    }
    
    // Extract the base URL from the endpoint without the /generate part
    const baseUrl = endpoint.replace('/generate', '');
    
    // Use a shorter timeout for health check
    const response = await axios.get(`${baseUrl}/tags`, {
      timeout: 5000 // 5 second timeout
    });
    
    const duration = Date.now() - startTime;
    logger.debug(`Ollama availability check completed in ${duration}ms`);
    
    // If we get a successful response, Ollama is available
    return response.status === 200;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.warn(`Ollama availability check failed in ${duration}ms: ${error.message}`);
    return false;
  }
}

/**
 * Generate text using Ollama's Mistral model
 * @param {string} prompt - The prompt to generate text from
 * @param {Object} options - Additional options for text generation
 * @returns {Promise<string>} The generated text
 */
async function generateText(prompt, options = {}) {
  const startTime = Date.now();
  let success = false;
  
  try {
    if (!prompt || typeof prompt !== 'string') {
      throw new AppError('Invalid prompt: must be a non-empty string', 400);
    }
    
    const ollamaEndpoint = config.ollama.endpoint || 'http://localhost:11434/api/generate';
    const model = options.model || config.ollama.model;
    
    logger.info(`Generating text with Ollama model: ${model}`);
    
    // Check Ollama availability before attempting to generate
    const isAvailable = await checkOllamaAvailability();
    if (!isAvailable) {
      throw new AppError('Ollama service is not available', 503, {
        suggestedAction: 'Please ensure Ollama is running and accessible'
      });
    }
    
    const response = await axios.post(ollamaEndpoint, {
      model: model,
      prompt: prompt,
      options: {
        temperature: options.temperature || config.ollama.temperature,
        num_predict: options.maxTokens || config.ollama.maxTokens,
      },
      stream: false
    }, {
      timeout: options.timeout || 60000 // 60 second timeout for LLM responses
    });

    if (!response.data || !response.data.response) {
      throw new AppError('Invalid response from Ollama', 500);
    }

    // Track successful call
    success = true;
    const duration = Date.now() - startTime;
    logger.info(`Generated text with Ollama in ${duration}ms`);
    
    // Return the generated text
    return response.data.response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error.code === 'ECONNREFUSED') {
      logger.error('Failed to connect to Ollama. Is the Ollama server running?');
      throw new AppError(
        'Ollama server is not running', 
        503, 
        { suggestedAction: 'Please start the Ollama server and try again' }
      );
    }
    
    if (error.response) {
      logger.error(`Ollama API error (${error.response.status}): ${error.response.data?.error || error.message}`);
      throw new AppError(
        `Ollama API error: ${error.response.data?.error || error.message}`, 
        error.response.status >= 400 && error.response.status < 500 ? error.response.status : 500
      );
    }
    
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error(`Error generating text with Ollama: ${error.message}`);
    throw new AppError(`Error generating text with Ollama: ${error.message}`, 500);
  } finally {
    // Track Ollama call metrics
    const duration = Date.now() - startTime;
    monitor.trackOllamaCall(success, duration);
  }
}

/**
 * Enrich data using Ollama
 * @param {Object} data - The data to enrich
 * @param {string} instruction - The instruction for enrichment
 * @param {Object} options - Additional options for enrichment
 * @returns {Promise<Object>} The enriched data
 */
async function enrichData(data, instruction, options = {}) {
  const startTime = Date.now();
  try {
    if (!data) {
      throw new AppError('No data provided for enrichment', 400);
    }
    
    if (!instruction) {
      throw new AppError('No instruction provided for enrichment', 400);
    }
    
    logger.info('Starting data enrichment with Ollama');
    
    // Prepare data for prompt
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    const prompt = `
      ${instruction}
      
      Data: ${dataStr}
      
      Please give your response in valid JSON format. Make sure the JSON output is properly formatted.
      Response:
    `;

    const generationOptions = {
      temperature: options.temperature || 0.2,
      maxTokens: options.maxTokens || config.ollama.maxTokens,
      model: options.model || config.ollama.model,
      timeout: options.timeout || 60000
    };

    const response = await generateText(prompt, generationOptions);
    
    // Extract the JSON part of the response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/) || 
                      [null, response];
                      
    const jsonStr = jsonMatch[1] || response;
    
    try {
      // Clean up the JSON string
      const cleanedJsonStr = jsonStr.trim()
        .replace(/^```(json)?/, '')
        .replace(/```$/, '')
        .trim();
      
      const enrichedData = JSON.parse(cleanedJsonStr);
      
      const duration = Date.now() - startTime;
      logger.info(`Data enrichment completed in ${duration}ms`);
      
      return enrichedData;
    } catch (parseError) {
      logger.error(`Error parsing enriched data: ${parseError.message}`);
      logger.debug(`Raw response: ${response}`);
      
      // In case of parsing error, return the original data with the raw enriched text
      return {
        ...data,
        enriched_text: response,
        _parse_error: parseError.message
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Error enriching data: ${error.message}`);
    monitor.trackError(error, 'enrichData');
    
    // In case of API error, return the original data
    return {
      ...data,
      _error: error.message
    };
  }
}

module.exports = {
  generateText,
  enrichData,
  checkOllamaAvailability
}; 