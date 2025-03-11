const { enrichData, generateSummaries, categorizeData } = require('../../../src/transformers/dataEnricher');
const { enrichData: enrichWithOpenAI } = require('../../../src/utils/openaiClient');

// Mock the OpenAI client
jest.mock('../../../src/utils/openaiClient', () => ({
  enrichData: jest.fn(),
}));

describe('dataEnricher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enrichData', () => {
    test('should enrich a single item with AI-generated content', async () => {
      // Mock the AI enrichment response
      enrichWithOpenAI.mockResolvedValue({
        greeting: 'Hello John, welcome to our platform!',
      });

      const data = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
      };

      const instruction = 'Add a personalized greeting based on the name.';

      const result = await enrichData(data, {
        instruction,
        fields: ['name'],
      });

      expect(enrichWithOpenAI).toHaveBeenCalledWith(
        { name: 'John' },
        instruction
      );

      expect(result).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        greeting: 'Hello John, welcome to our platform!',
      });
    });

    test('should enrich an array of items with AI-generated content', async () => {
      // Mock the AI enrichment responses
      enrichWithOpenAI
        .mockResolvedValueOnce({
          greeting: 'Hello John, welcome to our platform!',
        })
        .mockResolvedValueOnce({
          greeting: 'Hello Jane, nice to see you again!',
        });

      const data = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' },
      ];

      const instruction = 'Add a personalized greeting based on the name.';

      const result = await enrichData(data, {
        instruction,
        fields: ['name'],
        batchSize: 10,
      });

      expect(enrichWithOpenAI).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        {
          id: 1,
          name: 'John',
          email: 'john@example.com',
          greeting: 'Hello John, welcome to our platform!',
        },
        {
          id: 2,
          name: 'Jane',
          email: 'jane@example.com',
          greeting: 'Hello Jane, nice to see you again!',
        },
      ]);
    });

    test('should handle errors during enrichment', async () => {
      // Mock an error during AI enrichment
      enrichWithOpenAI.mockRejectedValue(new Error('API error'));

      const data = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
      };

      const instruction = 'Add a personalized greeting based on the name.';

      const result = await enrichData(data, {
        instruction,
        fields: ['name'],
      });

      // Should return original data on error
      expect(result).toEqual(data);
    });
  });

  describe('generateSummaries', () => {
    test('should generate summaries for text fields', async () => {
      // Mock the AI summarization response
      enrichWithOpenAI.mockResolvedValue({
        summary: 'A compact description of the product.',
      });

      const data = {
        id: 1,
        name: 'Product',
        description: 'This is a lengthy description of the product with many details that need to be summarized into a shorter version for display purposes.',
      };

      const result = await generateSummaries(data, ['description'], 50);

      expect(enrichWithOpenAI).toHaveBeenCalled();
      expect(result).toHaveProperty('description_summary', 'A compact description of the product.');
    });
  });

  describe('categorizeData', () => {
    test('should categorize data based on text content', async () => {
      // Mock the AI categorization response
      enrichWithOpenAI.mockResolvedValue('Technology');

      const data = {
        id: 1,
        title: 'New smartphone features',
        content: 'The latest smartphone models include advanced AI capabilities.',
      };

      const categories = ['Technology', 'Health', 'Finance', 'Entertainment'];

      const result = await categorizeData(data, categories, 'content');

      expect(enrichWithOpenAI).toHaveBeenCalled();
      expect(result).toHaveProperty('category', 'Technology');
    });

    test('should handle invalid category responses', async () => {
      // Mock an invalid category response
      enrichWithOpenAI.mockResolvedValue('Invalid Category');

      const data = {
        id: 1,
        title: 'New smartphone features',
        content: 'The latest smartphone models include advanced AI capabilities.',
      };

      const categories = ['Technology', 'Health', 'Finance', 'Entertainment'];

      const result = await categorizeData(data, categories, 'content');

      expect(enrichWithOpenAI).toHaveBeenCalled();
      // Should default to 'Other' for unrecognized categories
      expect(result).toHaveProperty('category', 'Other');
    });
  });
}); 