import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '@shared/schema';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Read database URL from .env file if it exists
let databaseUrl = "";
try {
  // Check if .env file exists and read it
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=(.+)/);
    if (match && match[1]) {
      databaseUrl = match[1].trim();
    }
  }
} catch (error) {
  console.error('Failed to read .env file:', error);
}

// If not found in .env, try process.env
if (!databaseUrl) {
  databaseUrl = process.env.DATABASE_URL || '';
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env or environment variables');
  process.exit(1);
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if a connection couldn't be established
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });

// Function to initialize the database
export async function initializeDatabase() {
  try {
    // Verify database connection
    const result = await pool.query('SELECT NOW()');
    console.log('Successfully connected to the database at:', result.rows[0].now);
    
    // You could run migrations or other initial setup here
    
    return true;
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    return false;
  }
}

// Export schema for convenience
export { schema }; 