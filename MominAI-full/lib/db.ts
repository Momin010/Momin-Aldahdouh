import { sql, db } from '@vercel/postgres';

// For simple, single queries in serverless functions, use `sql`.
// It automatically handles connection pooling.
// For transactions, you need to connect a client via `db`.

export { sql, db };
