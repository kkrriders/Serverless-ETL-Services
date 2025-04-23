# ETL Integration Testing Guide

This document explains how to run the ETL integration tests to verify the correct functionality of file uploads, ETL processing, and frontend-backend integration.

## Overview

The test suite includes:

1. **Test Data Generation**: Creates sample CSV, JSON, XML, and text files for testing
2. **Backend ETL Tests**: Validates the ETL service API endpoints
3. **Frontend Integration**: Tests the complete user flow in the browser UI

## Prerequisites

- Node.js 18+ installed
- Backend and frontend services properly configured
- MongoDB instance (if using MongoDB as a destination)

## Running the Tests

### 1. Complete ETL Test Suite

To run the full ETL test suite in one step:

```bash
# Make sure the servers are running
npm run dev

# In a separate terminal, run the test suite
npm run test:etl
```

This will:
- Generate test data files
- Verify the backend is running
- Run the backend ETL tests
- Provide instructions for manual frontend testing

### 2. Individual Test Components

You can also run each test component separately:

```bash
# Generate test data only
npm run test:generate-data

# Run backend ETL tests only
npm run test:backend-etl
```

### 3. Manual Frontend Testing

For frontend testing:

1. Ensure both backend and frontend are running:
   ```bash
   npm run dev
   ```

2. Open the File ETL page in your browser:
   ```
   http://localhost:3000/file-etl
   ```

3. Upload test files from the `tests/test-data` directory
4. Follow the ETL pipeline steps in the UI

## Test Files

The test data generator creates these files in `tests/test-data/`:

- `users.csv` - Sample user data in CSV format
- `products.json` - Product catalog in JSON format
- `orders.xml` - Order records in XML format
- `application.log` - Sample log file in text format

## Test Results

Backend test results are saved in the `tests/test-results/` directory as JSON files:

- `csv-extraction.json` - Results from CSV extraction
- `json-extraction.json` - Results from JSON extraction
- `transformation.json` - Results from data transformation
- `loading.json` - Results from data loading
- `orchestration.json` - Results from full ETL orchestration

## Troubleshooting

### Backend Tests Failing

- Verify the backend server is running on port 3001
- Check the API key matches in frontend and backend
- Ensure the ETL service has the required dependencies installed
- Look for detailed error messages in the test output

### Frontend Tests Failing

- Check browser console for JavaScript errors
- Verify frontend is properly configured to connect to backend
- Ensure the file upload component is working correctly
- Try different file formats to isolate any format-specific issues

## Extending the Tests

To add new tests:

1. Add new test data generation in `generate-test-data.js`
2. Add additional test cases in `backend-etl-test.js`
3. For frontend testing, update the `FileUploadETL.tsx` component 