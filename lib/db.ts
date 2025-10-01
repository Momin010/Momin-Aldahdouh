import { sql } from '@vercel/postgres';

// For serverless functions, `@vercel/postgres` recommends using the `sql`
// template tag directly. It automatically handles connection management
// (opening and closing connections) for each query, and it reads the
// connection string from environment variables like `POSTGRES_URL` by default.
// This is more efficient and reliable in a serverless environment than
// managing a long-lived connection pool.

export { sql };
