const axios = require('axios');
const logger = require('./logger');
const { config } = require('../config/config');

/**
 * Check if Ollama is available
 * @returns {Promise<boolean>} True if Ollama is available
 */
async function checkOllamaAvailability() {
  try {
    const ollamaEndpoint = config.ollama.endpoint || 'http://localhost:11434/api/generate';
    // Extract the base URL from the endpoint
    const baseUrl = ollamaEndpoint.split('/api')[0];
    
    // Try to access the Ollama API
    await axios.get(`${baseUrl}/api/version`);
    return true;
  } catch (error) {
    logger.warn(`Ollama not available: ${error.message}`);
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
  try {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt: must be a non-empty string');
    }
    
    const ollamaEndpoint = config.ollama.endpoint || 'http://localhost:11434/api/generate';
    const model = options.model || config.ollama.model;
    
    logger.info(`Generating text with Ollama model: ${model}`);
    
    const response = await axios.post(ollamaEndpoint, {
      model: model,
      prompt: prompt,
      options: {
        temperature: options.temperature || config.ollama.temperature,
        num_predict: options.maxTokens || config.ollama.maxTokens,
      },
      stream: false
    }, {
      timeout: 60000 // 60 second timeout for LLM responses
    });

    if (!response.data || !response.data.response) {
      throw new Error('Invalid response from Ollama');
    }

    // Return the generated text
    return response.data.response;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logger.error('Failed to connect to Ollama. Is the Ollama server running?');
      throw new Error('Ollama server is not running. Please start the Ollama server and try again.');
    }
    
    if (error.response) {
      logger.error(`Ollama API error (${error.response.status}): ${error.response.data?.error || error.message}`);
    } else {
      logger.error(`Error generating text with Ollama: ${error.message}`);
    }
    
    throw error;
  }
}

/**
 * Enrich data using Ollama
 * @param {Object} data - The data to enrich
 * @param {string} instruction - The instruction for enrichment
 * @returns {Promise<Object>} The enriched data
 */
async function enrichData(data, instruction) {
  try {
    if (!data) {
      throw new Error('No data provided for enrichment');
    }
    
    if (!instruction) {
      throw new Error('No instruction provided for enrichment');
    }
    
    const prompt = `
      ${instruction}
      
      Data: ${JSON.stringify(data, null, 2)}
      
      Please give your response in valid JSON format. Make sure the JSON output is properly formatted.
      Response:
    `;

    const response = await generateText(prompt, { temperature: 0.2 });
    
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
      
      return JSON.parse(cleanedJsonStr);
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
    logger.error(`Error enriching data: ${error.message}`);
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