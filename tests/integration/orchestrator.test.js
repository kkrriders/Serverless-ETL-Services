const { orchestrate } = require('../../src/handlers/orchestratorHandler');
const axios = require('axios');
const mongoose = require('mongoose');

// Mock the axios module
jest.mock('axios');

// Mock the mongoose connection
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      collection: jest.fn().mockReturnValue({
        insertMany: jest.fn().mockResolvedValue({ insertedCount: 3 }),
        bulkWrite: jest.fn().mockResolvedValue({ upsertedCount: 3 }),
      }),
    },
  };
});

describe('Orchestrator Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully orchestrate the ETL process', async () => {
    // Mock API response for extract
    axios.mockResolvedValueOnce({
      data: [
        { id: 1, name: 'User 1', email: 'user1@example.com' },
        { id: 2, name: 'User 2', email: 'user2@example.com' },
        { id: 3, name: 'User 3', email: 'user3@example.com' },
      ],
      status: 200,
    });

    // Mock request object
    const req = {
      body: {
        source: {
          type: 'api',
          url: 'https://jsonplaceholder.typicode.com/users',
        },
        transformations: {
          clean: {
            removeEmpty: true,
          },
          enrich: {
            instruction: 'Generate a personalized greeting for each user',
            fields: ['name'],
          },
        },
        destination: {
          type: 'mongodb',
          collection: 'enriched_users',
        },
      },
    };

    // Execute the orchestrator
    const response = await orchestrate({}, req);

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.extractResult.success).toBe(true);
    expect(response.body.transformResult.success).toBe(true);
    expect(axios).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledWith({
      url: 'https://jsonplaceholder.typicode.com/users',
      method: 'GET',
      headers: {},
      params: {},
      data: {},
      timeout: 10000,
    });
  });

  it('should handle source configuration errors', async () => {
    // Mock request with missing source
    const req = {
      body: {
        transformations: {
          clean: {
            removeEmpty: true,
          },
        },
        destination: {
          type: 'mongodb',
          collection: 'enriched_users',
        },
      },
    };

    // Execute the orchestrator
    const response = await orchestrate({}, req);

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Source configuration is required');
  });

  it('should handle destination configuration errors', async () => {
    // Mock request with missing destination
    const req = {
      body: {
        source: {
          type: 'api',
          url: 'https://jsonplaceholder.typicode.com/users',
        },
        transformations: {
          clean: {
            removeEmpty: true,
          },
        },
      },
    };

    // Execute the orchestrator
    const response = await orchestrate({}, req);

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Destination configuration is required');
  });
}); 