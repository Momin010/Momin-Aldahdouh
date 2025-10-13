import { sql } from '../../lib/db';
import type { DatabaseConfig, DatabaseTable, DatabaseField } from '../../services/databaseService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userEmail, projectId, schema } = req.body;

    if (!userEmail || !projectId || !schema) {
      return res.status(400).json({
        message: 'Missing required fields: userEmail, projectId, schema'
      });
    }

    const databaseName = `mominai_${userEmail.replace('@', '_').replace('.', '_')}_${projectId}`;
    const tablePrefix = `${databaseName}_`;

    console.log(`Creating cloud database for user: ${userEmail}, project: ${projectId}`);

    // Create user-specific database tables
    const createdTables: string[] = [];
    const errors: string[] = [];

    for (const table of schema.tables) {
      try {
        const tableName = `${tablePrefix}${table.name.toLowerCase()}`;

        // Build CREATE TABLE SQL
        let createTableSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (`;

        const fieldDefinitions: string[] = [];

        for (const field of table.fields) {
          let fieldSQL = `"${field.name}" `;

          // Map field types to PostgreSQL types
          switch (field.type) {
            case 'string':
              fieldSQL += 'VARCHAR(255)';
              break;
            case 'number':
              fieldSQL += 'DECIMAL(10,2)';
              break;
            case 'boolean':
              fieldSQL += 'BOOLEAN';
              break;
            case 'date':
              fieldSQL += 'TIMESTAMP WITH TIME ZONE';
              break;
            case 'text':
              fieldSQL += 'TEXT';
              break;
            case 'json':
              fieldSQL += 'JSONB';
              break;
            default:
              fieldSQL += 'VARCHAR(255)';
          }

          if (field.required) fieldSQL += ' NOT NULL';
          if (field.unique) fieldSQL += ' UNIQUE';
          if (field.defaultValue !== undefined) {
            if (typeof field.defaultValue === 'string') {
              fieldSQL += ` DEFAULT '${field.defaultValue}'`;
            } else {
              fieldSQL += ` DEFAULT ${field.defaultValue}`;
            }
          }

          fieldDefinitions.push(fieldSQL);
        }

        createTableSQL += fieldDefinitions.join(', ') + ')';

        // Execute CREATE TABLE
        await sql.query(createTableSQL);
        createdTables.push(tableName);

        // Create indexes for unique fields
        for (const field of table.fields) {
          if (field.unique && field.name !== 'id') {
            const indexName = `${tableName}_${field.name}_unique`;
            await sql.query(`CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" ("${field.name}")`);
          }
        }

        // Create indexes for foreign keys (if relationships exist)
        if (schema.relationships) {
          for (const relationship of schema.relationships) {
            if (relationship.fromTable === table.name) {
              const indexName = `${tableName}_${relationship.fromField}_fk`;
              await sql.query(`CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" ("${relationship.fromField}")`);
            }
          }
        }

      } catch (tableError) {
        console.error(`Error creating table ${table.name}:`, tableError);
        errors.push(`Failed to create table ${table.name}: ${tableError instanceof Error ? tableError.message : 'Unknown error'}`);
      }
    }

    // Store database metadata
    try {
      await sql`
        INSERT INTO user_databases (user_email, project_id, database_name, schema_data, created_at, updated_at)
        VALUES (${userEmail}, ${projectId}, ${databaseName}, ${JSON.stringify(schema)}, NOW(), NOW())
        ON CONFLICT (user_email, project_id)
        DO UPDATE SET
          schema_data = EXCLUDED.schema_data,
          updated_at = NOW()
      `;
    } catch (metadataError) {
      console.error('Error storing database metadata:', metadataError);
      // Don't fail the whole operation for metadata issues
    }

    return res.status(200).json({
      success: true,
      databaseName,
      createdTables,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length === 0
        ? 'Database created successfully'
        : `Database created with ${errors.length} errors`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cloud database creation error:', error);
    return res.status(500).json({
      message: 'Cloud database creation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}