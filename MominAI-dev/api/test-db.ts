import { sql } from '../lib/db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Test database connection and check if tables exist
    const { rows: projectsTable } = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'projects'
    `;
    
    const { rows: usersTable } = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `;

    const { rows: projectCount } = await sql`SELECT COUNT(*) as count FROM projects`;

    return res.status(200).json({
      status: 'Database connection successful',
      tables: {
        projects: projectsTable.length > 0 ? 'exists' : 'missing',
        users: usersTable.length > 0 ? 'exists' : 'missing'
      },
      projectCount: projectCount[0]?.count || 0
    });
  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({ 
      status: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}