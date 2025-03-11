const { OpenAI } = require('openai');
const logger = require('./logger');
const { config } = require('../config/config');

// Create an OpenAI client instance
const openai = new OpenAI({ apiKey: config.openai.apiKey });

/**
 * Generate text using OpenAI GPT model
 * @param {string} prompt - The prompt to generate text from
 * @param {Object} options - Additional options for text generation
 * @returns {Promise<string>} The generated text
 */
async function generateText(prompt, options = {}) {
  try {
    const response = await openai.chat.completions.create({
      model: options.model || config.openai.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || config.openai.maxTokens,
      temperature: options.temperature || config.openai.temperature,
    });

    return response.choices[0].message.content;
  } catch (error) {
    logger.error(`Error generating text: ${error.message}`);
    throw error;
  }
}

/**
 * Enrich data using OpenAI
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