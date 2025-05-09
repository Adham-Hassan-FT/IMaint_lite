// Simple script to test the inventory item API endpoint
import fetch from 'node-fetch';

async function testInventoryItemAPI() {
  console.log('Testing inventory item API endpoint...');
  
  const testCases = [
    { 
      name: 'Empty unitCost',
      data: {
        partNumber: 'API-TEST-1',
        name: 'API Test 1',
        description: 'Testing API with empty unitCost',
        categoryId: null,
        unitCost: '',
        quantityInStock: 1,
        location: '',
        barcode: '',
        isActive: false
      }
    },
    { 
      name: 'Zero unitCost',
      data: {
        partNumber: 'API-TEST-2',
        name: 'API Test 2',
        description: 'Testing API with zero unitCost',
        categoryId: null,
        unitCost: '0',
        quantityInStock: 1,
        location: '',
        barcode: '',
        isActive: false
      }
    },
    { 
      name: 'Decimal unitCost',
      data: {
        partNumber: 'API-TEST-3',
        name: 'API Test 3',
        description: 'Testing API with decimal unitCost',
        categoryId: null,
        unitCost: '12.34',
        quantityInStock: 1,
        location: '',
        barcode: '',
        isActive: false
      }
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      
      const response = await fetch('http://localhost:5000/api/inventory-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Success! Response:`, data);
      } else {
        const errorText = await response.text();
        console.error(`Error (${response.status}):`, errorText);
      }
    } catch (error) {
      console.error(`Network error for ${testCase.name}:`, error.message);
    }
    
    console.log('-----------------------');
  }
  
  console.log('API tests completed');
}

testInventoryItemAPI(); 