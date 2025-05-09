import * as schema from '@shared/schema';
import fs from 'fs';
import path from 'path';

// Determine environment
const isProd = process.env.NODE_ENV?.toLowerCase() === 'production';

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

// DB setup based on environment
let db: any;
let initializeDatabase: () => Promise<boolean>;

if (isProd) {
  // PRODUCTION: Use Neon serverless
  console.log('Using Neon serverless database connection for production');
  const { drizzle } = await import('drizzle-orm/neon-http');
  const { neon } = await import('@neondatabase/serverless');
  
  const sql = neon(databaseUrl);
  db = drizzle(sql, { schema });
  
  initializeDatabase = async () => {
    try {
      const result = await sql`SELECT NOW()`;
      console.log('Successfully connected to the database at:', result[0].now);
      return true;
    } catch (error) {
      console.error('Failed to connect to the database:', error);
      return false;
    }
  };
} else {
  // DEVELOPMENT: Use standard PostgreSQL
  console.log('Using standard PostgreSQL connection for development');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { Pool } = await import('pg');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  db = drizzle(pool, { schema });
  
  initializeDatabase = async () => {
    try {
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