const { cleanData } = require('../../src/transformers/dataCleaner');

describe('Data Cleaner Tests', () => {
  it('should remove empty and null fields', async () => {
    // Test data with empty and null fields
    const data = [
      { id: 1, name: 'Test 1', description: '', tags: null, metadata: {} },
      { id: 2, name: 'Test 2', description: 'Sample description', tags: [], metadata: null },
    ];

    // Clean options
    const options = {
      removeEmpty: true,
    };

    // Clean the data
    const result = await cleanData(data, options);

    // Assertions
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 1, name: 'Test 1' });
    expect(result[1]).toEqual({ id: 2, name: 'Test 2', description: 'Sample description', tags: [] });
  });

  it('should trim text fields', async () => {
    // Test data with whitespace
    const data = {
      id: 1,
      name: '  Test Name  ',
      description: ' Description with whitespace  ',
      code: 'ABC123',
    };

    // Clean options
    const options = {
      textFields: ['name', 'description'],
      textOptions: {
        trim: true,
      },
    };

    // Clean the data
    const result = await cleanData(data, options);

    // Assertions
    expect(result.name).toBe('Test Name');
    expect(result.description).toBe('Description with whitespace');
    expect(result.code).toBe('ABC123'); // Unchanged
  });

  it('should convert date strings to Date objects', async () => {
    // Test data with date strings
    const data = {
      id: 1,
      name: 'Test',
      createdAt: '2023-01-01T12:00:00Z',
      updatedAt: '2023-01-02',
      randomField: 'Not a date',
    };

    // Clean options
    const options = {
      dateFields: ['createdAt', 'updatedAt'],
    };

    // Clean the data
    const result = await cleanData(data, options);

    // Assertions
    expect(result.createdAt instanceof Date).toBe(true);
    expect(result.updatedAt instanceof Date).toBe(true);
    expect(result.randomField).toBe('Not a date');
    expect(result.createdAt.toISOString()).toBe('2023-01-01T12:00:00.000Z');
  });

  it('should handle arrays of objects', async () => {
    // Test data with arrays
    const data = [
      { id: 1, name: '  User 1  ', createdAt: '2023-01-01' },
      { id: 2, name: '  User 2  ', createdAt: '2023-01-02' },
    ];

    // Clean options
    const options = {
      textFields: ['name'],
      textOptions: { trim: true },
      dateFields: ['createdAt'],
    };

    // Clean the data
    const result = await cleanData(data, options);

    // Assertions
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('User 1');
    expect(result[1].name).toBe('User 2');
    expect(result[0].createdAt instanceof Date).toBe(true);
    expect(result[1].createdAt instanceof Date).toBe(true);
  });

  it('should return original data if options are empty', async () => {
    // Test data
    const data = { id: 1, name: 'Test' };

    // Clean with no options
    const result = await cleanData(data, {});

    // Assertions
    expect(result).toEqual(data);
  });
}); 