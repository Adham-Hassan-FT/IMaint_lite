import * as schema from '@shared/schema';
import fs from 'fs';
import path from 'path';

// Determine environment - explicitly check for Vercel deployment
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV || process.cwd().includes('/vercel/');
const isProd = isVercel || process.env.NODE_ENV?.toLowerCase() === 'production';

console.log(`Environment: ${isProd ? 'Production' : 'Development'} (isVercel: ${isVercel}, NODE_ENV: ${process.env.NODE_ENV})`);

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

// Log masked URL for debugging
const maskedUrl = databaseUrl.replace(/(postgres:\/\/[^:]+:)([^@]+)(@.*)/, '$1****$3');
console.log(`Database URL format: ${maskedUrl}`);

// DB setup based on environment
let db: any;
let initializeDatabase: () => Promise<boolean>;

if (isProd) {
  // PRODUCTION: Use Neon serverless
  console.log('Using Neon serverless database connection for production');
  
  initializeDatabase = async () => {
    try {
      // Import and use dedicated Neon module
      const { setupNeonDb } = await import('./neondb');
      const { db: neonDb, sql } = setupNeonDb(databaseUrl);
      
      // Set the global db reference
      db = neonDb;
      
      // Test connection
      const result = await sql`SELECT NOW()`;
      console.log('Successfully connected to the database at:', result[0].now);
      return true;
    } catch (error) {
      console.error('Failed to connect to the database:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && 'cause' in error) {
        console.error('Caused by:', (error as Error & { cause?: unknown }).cause);
      }
      return false;
    }
  };
} else {
  // DEVELOPMENT: Use standard PostgreSQL
  console.log('Using standard PostgreSQL connection for development');
  
  initializeDatabase = async () => {
    try {
      const { drizzle } = await import('drizzle-orm/node-postgres');
      const { Pool } = await import('pg');
      
      const pool = new Pool({
        connectionString: databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      
      db = drizzle(pool, { schema });
      
      const result = await pool.query('SELECT NOW()');
      console.log('Successfully connected to the database at:', result.rows[0].now);
      return true;
    } catch (error) {
      console.error('Failed to connect to the database:', error);
      return false;
    }
  };
}

// Export db and schema
export { db, initializeDatabase, schema }; 