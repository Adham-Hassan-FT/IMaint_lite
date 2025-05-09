import { DbStorage } from './dbStorage';
import { initializeDatabase } from './db';
import { seedDatabase } from './seedDatabase';

// Create a singleton instance of DbStorage
let storageInstance: DbStorage | null = null;

// Check if we're in Vercel or production environment
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV || process.cwd().includes('/vercel/');
const isProd = isVercel || process.env.NODE_ENV?.toLowerCase() === 'production';

console.log(`Storage Provider - Environment: ${isProd ? 'Production' : 'Development'} (isVercel: ${isVercel})`);

async function initializeStorage() {
  // First initialize the database connection
  const dbInitialized = await initializeDatabase();
  
  if (!dbInitialized) {
    console.error('Failed to initialize database connection. The application may not function correctly.');
  }
  
  // Create the database storage instance
  storageInstance = new DbStorage();
  console.log('Database storage initialized successfully');
  
  // Skip seeding if on Vercel or in production
  if (isVercel) {
    console.log('Skipping database seeding on Vercel deployment');
  } else if (isProd) {
    console.log('Skipping database seeding in production environment');
  } else {
    // Only seed in development and not on Vercel
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