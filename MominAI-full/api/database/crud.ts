import { sql } from '../../lib/db';

export default async function handler(req: any, res: any) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userEmail, projectId, tableName, action, data } = req.body || req.query;

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
    const fullTableName = `"${tablePrefix}${tableName}"`;

    switch (req.method) {
      case 'GET':
        // Query records
        try {
          let query = `SELECT * FROM ${fullTableName}`;
          const params = [];

          // Add WHERE clause if filters provided
          if (data && Object.keys(data).length > 0) {
            const conditions = Object.keys(data).map((key, index) => {
              params.push(data[key]);
              return `"${key}" = $${index + 1}`;
            });
            query += ` WHERE ${conditions.join(' AND ')}`;
          }

          // Add ORDER BY
          query += ` ORDER BY created_at DESC`;

          const result = await sql.query(query, params);
          return res.status(200).json({
            success: true,
            records: result.rows,
            count: result.rows.length
          });
        } catch (error) {
          return res.status(500).json({
            message: 'Failed to query records',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      case 'POST':
        // Create record
        if (!data) {
          return res.status(400).json({ message: 'Missing record data' });
        }

        try {
          const columns = Object.keys(data);
          const values = Object.values(data);
          const placeholders = values.map((_, i) => `$${i + 1}`);

          const insertQuery = `
            INSERT INTO ${fullTableName} (${columns.map(c => `"${c}"`).join(', ')})
            VALUES (${placeholders.join(', ')})
            RETURNING *
          `;

          const result = await sql.query(insertQuery, values);
          return res.status(201).json({
            success: true,
            record: result.rows[0]
          });
        } catch (error) {
          return res.status(500).json({
            message: 'Failed to create record',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      case 'PUT':
        // Update record
        if (!data || !data.id) {
          return res.status(400).json({ message: 'Missing record ID and data' });
        }

        try {
          const { id, ...updateData } = data;
          const columns = Object.keys(updateData);
          const values = Object.values(updateData);

          if (columns.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
          }

          const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
          const updateQuery = `
            UPDATE ${fullTableName}
            SET ${setClause}, updated_at = NOW()
            WHERE id = $${columns.length + 1}
            RETURNING *
          `;

          const result = await sql.query(updateQuery, [...values, id]);

          if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Record not found' });
          }

          return res.status(200).json({
            success: true,
            record: result.rows[0]
          });
        } catch (error) {
          return res.status(500).json({
            message: 'Failed to update record',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      case 'DELETE':
        // Delete record
        if (!data || !data.id) {
          return res.status(400).json({ message: 'Missing record ID' });
        }

        try {
          const deleteQuery = `DELETE FROM ${fullTableName} WHERE id = $1 RETURNING *`;
          const result = await sql.query(deleteQuery, [data.id]);

          if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Record not found' });
          }

          return res.status(200).json({
            success: true,
            deletedRecord: result.rows[0]
          });
        } catch (error) {
          return res.status(500).json({
            message: 'Failed to delete record',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Database CRUD error:', error);
    return res.status(500).json({
      message: 'Database operation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}