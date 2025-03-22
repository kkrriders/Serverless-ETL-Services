const axios = require('axios');
const logger = require('./logger');
const { config } = require('../config/config');

/**
 * Generate text using Ollama's Mistral model
 * @param {string} prompt - The prompt to generate text from
 * @param {Object} options - Additional options for text generation
 * @returns {Promise<string>} The generated text
 */
async function generateText(prompt, options = {}) {
  try {
    const ollamaEndpoint = config.ollama.endpoint || 'http://localhost:11434/api/generate';
    
    const response = await axios.post(ollamaEndpoint, {
      model: options.model || config.ollama.model,
      prompt: prompt,
      options: {
        temperature: options.temperature || config.ollama.temperature,
        num_predict: options.maxTokens || config.ollama.maxTokens,
      },
      stream: false
    });

    // Return the generated text
    return response.data.response;
  } catch (error) {
    logger.error(`Error generating text with Ollama: ${error.message}`);
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
    const prompt = `
      ${instruction}
      
      Data: ${JSON.stringify(data, null, 2)}
      
      Enriched data (in JSON format):
    `;

    const response = await generateText(prompt, { temperature: 0.2 });
    
    // Extract the JSON part of the response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/) || 
                      [null, response];
                      
    const jsonStr = jsonMatch[1] || response;
    
    try {
      return JSON.parse(jsonStr.trim());
    } catch (parseError) {
      logger.error(`Error parsing enriched data: ${parseError.message}`);
      // In case of parsing error, return the original data with the raw enriched text
      return {
        ...data,
        enriched_text: response,
      };
    }
  } catch (error) {
    logger.error(`Error enriching data: ${error.message}`);
    // In case of API error, return the original data
    return data;
  }
}

module.exports = {
  generateText,
  enrichData,
}; 