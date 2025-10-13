import { sql } from '../../lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userEmail, projectId } = req.query;

    if (!userEmail || !projectId) {
      return res.status(400).json({
        message: 'Missing required fields: userEmail, projectId'
      });
    }

    // Get database status
    const dbResult = await sql`
      SELECT database_name, schema_data, connection_status, created_at, updated_at
      FROM user_databases
      WHERE user_email = ${userEmail} AND project_id = ${projectId}
    `;

    if (dbResult.rows.length === 0) {
      return res.status(200).json({
        connected: false,
        message: 'No database found for this project'
      });
    }

    const db = dbResult.rows[0];
    const tablePrefix = `${db.database_name}_`;

    // Get table information
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE ${tablePrefix + '%'}
      ORDER BY table_name
    `;

    const tables = tablesResult.rows.map(row => ({
      name: row.table_name.replace(tablePrefix, ''),
      fullName: row.table_name
    }));

    // Get record counts for each table
    const tableStats = [];
    for (const table of tables) {
      try {
        const countResult = await sql.query(`SELECT COUNT(*) as count FROM "${table.fullName}"`);
        tableStats.push({
          name: table.name,
          recordCount: parseInt(countResult.rows[0].count)
        });
      } catch (error) {
        console.error(`Error getting count for table ${table.name}:`, error);
        tableStats.push({
          name: table.name,
          recordCount: 0,
          error: 'Unable to count records'
        });
      }
    }

    return res.status(200).json({
      connected: true,
      databaseName: db.database_name,
      connectionStatus: db.connection_status,
      schema: db.schema_data,
      tables: tableStats,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
      message: 'Database connected successfully'
    });

  } catch (error) {
    console.error('Database status check error:', error);
    return res.status(500).json({
      message: 'Database status check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}