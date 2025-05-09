import { initializeDatabase } from './db';
import { DbStorage } from './dbStorage';

async function testDbConnection() {
  console.log('Starting database test...');
  
  try {
    // Initialize database connection
    console.log('Initializing database...');
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('Failed to initialize database connection.');
      return;
    }
    
    console.log('Database initialized successfully');
    
    // Create storage instance
    const storage = new DbStorage();
    
    // Test inventory item creation
    console.log('Testing inventory item creation...');
    try {
      const testItem = {
        partNumber: `test-${Date.now()}`,
        name: 'Test Item',
        description: 'Test description',
        categoryId: null,
        unitCost: '',
        quantityInStock: 0,
        location: '',
        barcode: '',
        isActive: false
      };
      
      console.log('Creating item with data:', testItem);
      const newItem = await storage.createInventoryItem(testItem);
      console.log('Item created successfully:', newItem);
    } catch (error) {
      console.error('Error creating inventory item:', error);
    }
    
    console.log('Test completed');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testDbConnection(); 