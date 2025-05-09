import { db } from './db';
import { initializeDatabase } from './db';
import { insertInventoryItemSchema } from '@shared/schema';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

async function testInventoryItemCreation() {
  console.log('Starting inventory item creation test...');
  
  try {
    // Initialize database
    await initializeDatabase();
    console.log('Database initialized');
    
    // Test different input formats for unitCost
    const testCases = [
      { partNumber: 'TEST-1', name: 'Test Empty String', description: 'Testing empty string unitCost', unitCost: '', quantityInStock: 1 },
      { partNumber: 'TEST-2', name: 'Test Zero', description: 'Testing zero unitCost', unitCost: '0', quantityInStock: 1 },
      { partNumber: 'TEST-3', name: 'Test Decimal', description: 'Testing decimal unitCost', unitCost: '10.50', quantityInStock: 1 },
      { partNumber: 'TEST-4', name: 'Test Large Number', description: 'Testing large unitCost', unitCost: '9999.99', quantityInStock: 1 },
    ];
    
    // Test each case
    for (const testCase of testCases) {
      try {
        console.log(`Testing case: ${testCase.name}`);
        console.log('Input data:', testCase);
        
        // First try validation
        try {
          const validatedData = insertInventoryItemSchema.parse(testCase);
          console.log('Validation successful:', validatedData);
        } catch (validationError) {
          console.error('Validation error:', validationError);
          continue; // Skip to next test case if validation fails
        }
        
        // Then try database insertion using drizzle SQL template
        const unitCostValue = testCase.unitCost === '' ? '0.00' : testCase.unitCost;
        const result = await db.execute(sql`
          INSERT INTO inventory_items (part_number, name, description, unit_cost, quantity_in_stock)
          VALUES (${testCase.partNumber}, ${testCase.name}, ${testCase.description}, ${unitCostValue}, ${testCase.quantityInStock})
          RETURNING *
        `);
        
        console.log(`Successfully created inventory item: ${testCase.name}`);
        console.log('Database result:', result.rows?.[0] || result);
      } catch (error) {
        console.error(`Error with test case ${testCase.name}:`, error);
      }
      
      console.log('-----------------------');
    }
    
    console.log('Tests completed');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testInventoryItemCreation(); 