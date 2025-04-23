/**
 * Test Data Generator
 * 
 * This script generates sample data files for testing the ETL pipeline
 */
const fs = require('fs');
const path = require('path');

// Create test data directory if it doesn't exist
const testDataDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Generate CSV test data
function generateCsvData() {
  const header = 'id,name,age,email,country\n';
  const rows = [
    '1,John Doe,32,john@example.com,USA',
    '2,Jane Smith,28,jane@example.com,Canada',
    '3,Bob Johnson,45,bob@example.com,UK',
    '4,Alice Brown,36,alice@example.com,Australia',
    '5,Charlie Wilson,29,charlie@example.com,Germany'
  ];
  
  const csvContent = header + rows.join('\n');
  fs.writeFileSync(path.join(testDataDir, 'users.csv'), csvContent);
  console.log('✅ Generated users.csv test file');
}

// Generate JSON test data
function generateJsonData() {
  const products = [
    { id: 1, name: 'Laptop', price: 1200, category: 'Electronics', inStock: true },
    { id: 2, name: 'Smartphone', price: 800, category: 'Electronics', inStock: true },
    { id: 3, name: 'Headphones', price: 150, category: 'Accessories', inStock: false },
    { id: 4, name: 'Monitor', price: 350, category: 'Electronics', inStock: true },
    { id: 5, name: 'Keyboard', price: 80, category: 'Accessories', inStock: true }
  ];
  
  fs.writeFileSync(
    path.join(testDataDir, 'products.json'),
    JSON.stringify(products, null, 2)
  );
  console.log('✅ Generated products.json test file');
}

// Generate XML test data
function generateXmlData() {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<orders>
  <order>
    <id>1001</id>
    <customer>John Doe</customer>
    <date>2023-05-15</date>
    <items>
      <item>
        <product>Laptop</product>
        <quantity>1</quantity>
        <price>1200</price>
      </item>
      <item>
        <product>Headphones</product>
        <quantity>1</quantity>
        <price>150</price>
      </item>
    </items>
    <total>1350</total>
  </order>
  <order>
    <id>1002</id>
    <customer>Jane Smith</customer>
    <date>2023-05-16</date>
    <items>
      <item>
        <product>Smartphone</product>
        <quantity>1</quantity>
        <price>800</price>
      </item>
    </items>
    <total>800</total>
  </order>
</orders>`;
  
  fs.writeFileSync(path.join(testDataDir, 'orders.xml'), xmlContent);
  console.log('✅ Generated orders.xml test file');
}

// Generate text file
function generateTextData() {
  const logContent = `[2023-05-15 08:30:12] INFO: User login successful
[2023-05-15 08:45:23] ERROR: Database connection failed
[2023-05-15 09:10:45] INFO: Order #1001 processed
[2023-05-15 09:30:11] WARNING: Low inventory for product #3
[2023-05-15 10:15:02] INFO: User logout
[2023-05-16 08:22:18] INFO: User login successful
[2023-05-16 08:35:42] INFO: Order #1002 processed
[2023-05-16 09:50:37] ERROR: Payment processing failed
[2023-05-16 10:05:23] INFO: User logout`;

  fs.writeFileSync(path.join(testDataDir, 'application.log'), logContent);
  console.log('✅ Generated application.log test file');
}

// Generate all sample data files
function generateAllTestData() {
  console.log('Generating test data files...');
  generateCsvData();
  generateJsonData();
  generateXmlData();
  generateTextData();
  console.log('✅ All test data files generated successfully in:', testDataDir);
}

// Run the generator
generateAllTestData(); 