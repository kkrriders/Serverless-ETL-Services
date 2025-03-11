const { cleanData, removeEmptyValues, standardizeDates, cleanTextFields } = require('../../../src/transformers/dataCleaner');

describe('dataCleaner', () => {
  describe('removeEmptyValues', () => {
    test('should remove null and undefined values from an object', () => {
      const data = {
        name: 'Test',
        description: 'Description',
        age: null,
        status: undefined,
        tags: ['tag1', null, 'tag2'],
      };

      const result = removeEmptyValues(data);

      expect(result).toEqual({
        name: 'Test',
        description: 'Description',
        tags: ['tag1', 'tag2'],
      });
    });

    test('should remove null and undefined values from an array', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        null,
        { id: 2, name: 'Item 2', description: null },
        undefined,
      ];

      const result = removeEmptyValues(data);

      expect(result).toEqual([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ]);
    });

    test('should handle nested objects and arrays', () => {
      const data = {
        name: 'Test',
        details: {
          age: null,
          address: {
            city: 'New York',
            zip: null,
          },
        },
        items: [
          { id: 1, value: 'Value 1' },
          { id: 2, value: null },
        ],
      };

      const result = removeEmptyValues(data);

      expect(result).toEqual({
        name: 'Test',
        details: {
          address: {
            city: 'New York',
          },
        },
        items: [
          { id: 1, value: 'Value 1' },
          { id: 2 },
        ],
      });
    });
  });

  describe('standardizeDates', () => {
    test('should standardize dates in ISO format', () => {
      const data = {
        name: 'Test',
        createdAt: '2023-01-15T12:30:45',
        updatedAt: '01/20/2023',
      };

      const result = standardizeDates(data, ['createdAt', 'updatedAt']);

      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    test('should standardize dates in YYYY-MM-DD format', () => {
      const data = {
        name: 'Test',
        createdAt: '2023-01-15T12:30:45',
        updatedAt: '01/20/2023',
      };

      const result = standardizeDates(data, ['createdAt', 'updatedAt'], 'YYYY-MM-DD');

      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should handle array of objects', () => {
      const data = [
        { id: 1, date: '2023-01-15' },
        { id: 2, date: '01/20/2023' },
      ];

      const result = standardizeDates(data, ['date'], 'YYYY-MM-DD');

      expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result[1].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('cleanTextFields', () => {
    test('should trim text fields', () => {
      const data = {
        name: '  Test Name  ',
        description: 'Description  ',
      };

      const result = cleanTextFields(data, ['name', 'description'], { trim: true });

      expect(result).toEqual({
        name: 'Test Name',
        description: 'Description',
      });
    });

    test('should convert text fields to lowercase', () => {
      const data = {
        name: 'Test Name',
        description: 'Description',
      };

      const result = cleanTextFields(data, ['name', 'description'], { lowercase: true });

      expect(result).toEqual({
        name: 'test name',
        description: 'description',
      });
    });

    test('should remove special characters', () => {
      const data = {
        name: 'Test Name!',
        description: 'Description with (special) characters.',
      };

      const result = cleanTextFields(data, ['name', 'description'], { removeSpecialChars: true });

      expect(result).toEqual({
        name: 'Test Name',
        description: 'Description with special characters',
      });
    });

    test('should apply multiple options', () => {
      const data = {
        name: '  Test Name!  ',
        description: 'Description WITH (special) characters.',
      };

      const result = cleanTextFields(data, ['name', 'description'], {
        trim: true,
        lowercase: true,
        removeSpecialChars: true,
      });

      expect(result).toEqual({
        name: 'test name',
        description: 'description with special characters',
      });
    });
  });

  describe('cleanData', () => {
    test('should apply multiple cleaning operations', () => {
      const data = {
        name: '  Test Name  ',
        description: null,
        createdAt: '2023-01-15',
        updatedAt: null,
        tags: ['Tag1', null, 'TAG2'],
      };

      const result = cleanData(data, {
        removeEmpty: true,
        dateFields: ['createdAt', 'updatedAt'],
        dateFormat: 'ISO',
        textFields: ['name', 'tags'],
        textOptions: {
          trim: true,
          lowercase: true,
        },
      });

      expect(result).toHaveProperty('name', 'test name');
      expect(result).not.toHaveProperty('description');
      expect(result).toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
      expect(result.tags).toEqual(['tag1', 'tag2']);
    });
  });
}); 