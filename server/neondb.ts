import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

export function setupNeonDb(databaseUrl: string) {
  console.log('Setting up Neon serverless database connection...');
  
  try {
    // Handle different URL formats for Neon
    let connectionString = databaseUrl;
    
    // Handle Prisma accelerate format
    if (connectionString.startsWith('prisma+postgres://')) {
      connectionString = connectionString.replace('prisma+postgres://', 'postgres://');
      console.log('Converted Prisma URL format to standard postgres URL');
    }
    
    // Log masked URL for debugging
    const maskedUrl = connectionString.replace(/(postgres:\/\/[^:]+:)([^@]+)(@.*)/, '$1****$3');
    console.log(`Using Neon with connection string format: ${maskedUrl}`);
    
    // Create the SQL client
    const sql = neon(connectionString);
    
    // Create and return the Drizzle ORM instance
    return { 
      db: drizzle(sql, { schema }),
      sql 
    };
  } catch (error) {
    console.error('Error setting up Neon database:', error);
    throw error;
  }
} 