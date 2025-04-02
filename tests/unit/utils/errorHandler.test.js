const { 
  AppError, 
  formatErrorResponse, 
  catchAsync, 
  handlePromise, 
  retry, 
} = require('../../../src/utils/errorHandler');

describe('errorHandler', () => {
  describe('AppError', () => {
    test('should create an AppError with default values', () => {
      const error = new AppError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({});
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
    });
    
    test('should create an AppError with custom values', () => {
      const details = { field: 'test', code: 123 };
      const error = new AppError('Test error', 400, details);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });
  
  describe('formatErrorResponse', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });
    
    test('should format an AppError', () => {
      const error = new AppError('Test error', 400, { field: 'test' });
      const response = formatErrorResponse(error);
      
      expect(response).toEqual({
        success: false,
        error: {
          message: 'Test error',
          status: 400,
          timestamp: error.timestamp,
          details: { field: 'test' },
          stack: error.stack,
        },
      });
    });
    
    test('should format a regular Error', () => {
      const error = new Error('Regular error');
      const response = formatErrorResponse(error);
      
      expect(response).toEqual({
        success: false,
        error: {
          message: 'Regular error',
          status: 500,
          timestamp: expect.any(String),
          stack: error.stack,
        },
      });
    });
    
    test('should not include stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Regular error');
      const response = formatErrorResponse(error);
      
      expect(response.error.stack).toBeUndefined();
      
      // Reset environment
      process.env.NODE_ENV = 'test';
    });
  });
  
  describe('catchAsync', () => {
    test('should catch async errors and pass them to next', async () => {
      const mockNext = jest.fn();
      const mockError = new Error('Async error');
      const mockReq = {};
      const mockRes = {};
      
      const asyncFn = jest.fn().mockRejectedValue(mockError);
      const wrappedFn = catchAsync(asyncFn);
      
      await wrappedFn(mockReq, mockRes, mockNext);
      
      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('handlePromise', () => {
    test('should handle resolved promises', async () => {
      const mockData = { id: 1, name: 'Test' };
      const promise = Promise.resolve(mockData);
      
      const [data, error] = await handlePromise(promise);
      
      expect(data).toEqual(mockData);
      expect(error).toBeNull();
    });
    
    test('should handle rejected promises', async () => {
      const mockError = new Error('Promise error');
      const promise = Promise.reject(mockError);
      
      const [data, error] = await handlePromise(promise);
      
      expect(data).toBeNull();
      expect(error).toEqual(mockError);
    });
    
    test('should use custom error handler if provided', async () => {
      const mockError = new Error('Promise error');
      const promise = Promise.reject(mockError);
      
      const customHandler = jest.fn().mockReturnValue('Handled error');
      
      const [data, error] = await handlePromise(promise, customHandler);
      
      expect(data).toBeNull();
      expect(error).toBe('Handled error');
      expect(customHandler).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('retry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    test('should resolve if function succeeds', async () => {
      const mockFn = jest.fn().mockResolvedValue('Success');
      
      const resultPromise = retry(mockFn, { retries: 3 });
      
      await expect(resultPromise).resolves.toBe('Success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
    
    test('should retry on failure and succeed eventually', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValue('Success on third attempt');
      
      const mockOnRetry = jest.fn();
      
      const resultPromise = retry(mockFn, { 
        retries: 3, 
        initialDelay: 100,
        onRetry: mockOnRetry,
      });
      
      // Fast-forward all timers
      jest.runAllTimers();
      
      await expect(resultPromise).resolves.toBe('Success on third attempt');
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(mockOnRetry).toHaveBeenCalledTimes(2);
    });
    
    test('should throw error after all retries fail', async () => {
      const mockError = new Error('All attempts failed');
      const mockFn = jest.fn().mockRejectedValue(mockError);
      
      const resultPromise = retry(mockFn, { 
        retries: 3, 
        initialDelay: 100,
      });
      
      // Fast-forward all timers
      jest.runAllTimers();
      
      await expect(resultPromise).rejects.toThrow(mockError);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });
}); 