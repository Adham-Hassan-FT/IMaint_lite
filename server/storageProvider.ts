import { DbStorage } from './dbStorage';
import { initializeDatabase } from './db';
import { seedDatabase } from './seedDatabase';

// Create a singleton instance of DbStorage
let storageInstance: DbStorage | null = null;

// Check if we're in production environment
const isProd = process.env.NODE_ENV?.toLowerCase() === 'production';

async function initializeStorage() {
  // First initialize the database connection
  const dbInitialized = await initializeDatabase();
  
  if (!dbInitialized) {
    console.error('Failed to initialize database connection. The application may not function correctly.');
  }
  
  // Create the database storage instance
  storageInstance = new DbStorage();
  console.log('Database storage initialized successfully');
  
  // Seed the database with initial data (will be skipped in production)
  if (!isProd) {
    try {
      await seedDatabase();
    } catch (error) {
      console.error('Error during database seeding:', error);
    }
  }
  
  return storageInstance;
}

// Proxy to ensure storage is accessed only after initialization
const storage = new Proxy({} as DbStorage, {
  get: function(target, prop) {
    if (!storageInstance) {
      throw new Error('Storage accessed before initialization. Make sure to call initializeStorage() first.');
    }
    return storageInstance[prop as keyof DbStorage];
  }
});

// Export the storage proxy and initialization function
export { storage, initializeStorage }; 