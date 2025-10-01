import { createPool } from '@vercel/postgres';

// Vercel automatically provides the POSTGRES_URL environment variable
// when a Vercel Postgres database is connected to a project.
// Explicitly creating a pool makes the connection more robust and fixes potential issues
// where the automatic detection might fail in some serverless environments.
const pool = createPool({
  connectionString: process.env.POSTGRES_URL,
});

// We are now exporting the sql template tag from our configured pool.
export const { sql } = pool;
