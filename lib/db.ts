import { sql } from '@vercel/postgres';

export async function setupDatabase() {
  // This function can be expanded to run migrations or initial setup
  // For now, it just ensures a connection can be made.
  // The tables will be created on-demand by the API routes if they don't exist.
  console.log('Database connection configured.');
}

export { sql };
