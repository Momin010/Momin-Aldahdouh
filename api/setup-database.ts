import { sql } from '../lib/db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        history JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_user_email ON projects(user_email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC)`;

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create user_databases table for MominAI Cloud
    await sql`
      CREATE TABLE IF NOT EXISTS user_databases (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        project_id VARCHAR(255) NOT NULL,
        database_name VARCHAR(255) NOT NULL,
        schema_data JSONB NOT NULL,
        connection_status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, project_id)
      )
    `;

    // Create indexes for user_databases
    await sql`CREATE INDEX IF NOT EXISTS idx_user_databases_user_email ON user_databases(user_email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_databases_project_id ON user_databases(project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_databases_status ON user_databases(connection_status)`;

    return res.status(200).json({
      message: 'Database setup completed successfully (including MominAI Cloud tables)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return res.status(500).json({
      message: 'Database setup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}