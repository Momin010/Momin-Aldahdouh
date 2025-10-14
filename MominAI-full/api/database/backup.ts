import { sql } from '../../lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userEmail, projectId, action } = req.body;

    if (!userEmail || !projectId) {
      return res.status(400).json({
        message: 'Missing required fields: userEmail, projectId'
      });
    }

    // Get database info
    const dbResult = await sql`
      SELECT database_name, schema_data FROM user_databases
      WHERE user_email = ${userEmail} AND project_id = ${projectId} AND connection_status = 'active'
    `;

    if (dbResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Database not found or not connected'
      });
    }

    const { database_name, schema_data } = dbResult.rows[0];
    const tablePrefix = `${database_name}_`;

    if (action === 'backup') {
      // Create backup of all tables and their data
      const backup: any = {
        timestamp: new Date().toISOString(),
        databaseName: database_name,
        schema: schema_data,
        tables: {}
      };

      // Get all table names
      const tablesResult = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE ${tablePrefix + '%'}
        ORDER BY table_name
      `;

      for (const tableRow of tablesResult.rows) {
        const tableName = tableRow.table_name;
        const cleanTableName = tableName.replace(tablePrefix, '');

        try {
          // Get all records from this table
          const recordsResult = await sql.query(`SELECT * FROM "${tableName}" ORDER BY created_at DESC`);
          backup.tables[cleanTableName] = recordsResult.rows;
        } catch (tableError) {
          console.error(`Error backing up table ${tableName}:`, tableError);
          backup.tables[cleanTableName] = { error: 'Failed to backup table' };
        }
      }

      // Store backup in database
      await sql`
        INSERT INTO database_backups (user_email, project_id, backup_data, created_at)
        VALUES (${userEmail}, ${projectId}, ${JSON.stringify(backup)}, NOW())
      `;

      return res.status(200).json({
        success: true,
        message: 'Database backup created successfully',
        backupId: `backup_${Date.now()}`,
        tableCount: Object.keys(backup.tables).length,
        timestamp: backup.timestamp
      });

    } else if (action === 'restore') {
      const { backupId } = req.body;

      if (!backupId) {
        return res.status(400).json({ message: 'Missing backupId for restore' });
      }

      // Get backup data
      const backupResult = await sql`
        SELECT backup_data FROM database_backups
        WHERE user_email = ${userEmail} AND project_id = ${projectId} AND id = ${backupId}
      `;

      if (backupResult.rows.length === 0) {
        return res.status(404).json({ message: 'Backup not found' });
      }

      const backup = JSON.parse(backupResult.rows[0].backup_data);

      // Restore each table
      const restoreResults = [];
      for (const [tableName, records] of Object.entries(backup.tables)) {
        const fullTableName = `${tablePrefix}${tableName}`;

        try {
          if (Array.isArray(records) && records.length > 0) {
            // Clear existing data
            await sql.query(`DELETE FROM "${fullTableName}"`);

            // Insert backup data
            for (const record of records) {
              const columns = Object.keys(record);
              const values = Object.values(record);
              const placeholders = values.map((_, i) => `$${i + 1}`);

              const insertQuery = `
                INSERT INTO "${fullTableName}" (${columns.map(c => `"${c}"`).join(', ')})
                VALUES (${placeholders.join(', ')})
              `;

              await sql.query(insertQuery, values);
            }
          }

          restoreResults.push({
            table: tableName,
            status: 'success',
            recordCount: Array.isArray(records) ? records.length : 0
          });
        } catch (tableError) {
          console.error(`Error restoring table ${tableName}:`, tableError);
          restoreResults.push({
            table: tableName,
            status: 'error',
            error: tableError instanceof Error ? tableError.message : 'Unknown error'
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Database restore completed',
        results: restoreResults,
        timestamp: new Date().toISOString()
      });

    } else if (action === 'list') {
      // List all backups for this database
      const backupsResult = await sql`
        SELECT id, created_at FROM database_backups
        WHERE user_email = ${userEmail} AND project_id = ${projectId}
        ORDER BY created_at DESC
      `;

      return res.status(200).json({
        success: true,
        backups: backupsResult.rows.map(backup => ({
          id: backup.id,
          createdAt: backup.created_at,
          formattedDate: new Date(backup.created_at).toLocaleString()
        }))
      });
    }

    return res.status(400).json({ message: 'Invalid action. Use: backup, restore, or list' });

  } catch (error) {
    console.error('Database backup/restore error:', error);
    return res.status(500).json({
      message: 'Database backup/restore operation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}