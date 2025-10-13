import { sendAiChatRequest } from '../../services/geminiService';
import type { DatabaseConfig, DatabaseTable, DatabaseField } from '../../services/databaseService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId, htmlContent, userRequirements, projectName } = req.body;

    if (!htmlContent || !projectName) {
      return res.status(400).json({
        message: 'Missing required fields: htmlContent and projectName'
      });
    }

    // Create AI prompt for database schema generation
    const systemPrompt = `You are an expert database architect. Analyze the provided HTML content and user requirements to generate a comprehensive database schema.

Your task is to:
1. Analyze the HTML content to understand what kind of application/website this is
2. Identify the main entities/data models needed
3. Determine relationships between entities
4. Create appropriate database tables with proper fields
5. Suggest data types, constraints, and relationships

Return a JSON object with the following structure:
{
  "databaseName": "string",
  "tables": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "fields": [
        {
          "id": "string",
          "name": "string",
          "type": "string|number|boolean|date|text|json",
          "required": boolean,
          "unique": boolean,
          "defaultValue": "any",
          "description": "string"
        }
      ]
    }
  ],
  "relationships": [
    {
      "id": "string",
      "fromTable": "string",
      "fromField": "string",
      "toTable": "string",
      "toField": "string",
      "type": "one-to-one|one-to-many|many-to-many"
    }
  ]
}

Guidelines:
- Always include common fields like 'id' (primary key), 'created_at', 'updated_at'
- Use appropriate data types (string for VARCHAR, number for DECIMAL/INTEGER, etc.)
- Set required=true for essential fields
- Use meaningful table and field names
- Include relationships where entities are connected
- Consider the application type (ecommerce, blog, user management, etc.)`;

    const userPrompt = `Please analyze this HTML content and generate a database schema:

Project Name: ${projectName}

${userRequirements ? `User Requirements: ${userRequirements}` : ''}

HTML Content:
${htmlContent.substring(0, 5000)}...`; // Limit HTML content length

    // Call AI to generate schema
    const aiResponse = await sendAiChatRequest(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      null, // No files needed
      null, // No attachments
      null, // No abort controller
      undefined // No progress callback
    );

    if (!aiResponse || aiResponse.responseType !== 'CHAT') {
      return res.status(500).json({
        message: 'Failed to generate database schema'
      });
    }

    // Parse AI response to extract database schema
    try {
      const schemaData = JSON.parse(aiResponse.message);

      // Validate schema structure
      if (!schemaData.databaseName || !Array.isArray(schemaData.tables)) {
        throw new Error('Invalid schema structure');
      }

      // Ensure each table has required fields
      schemaData.tables.forEach((table: any) => {
        if (!table.id || !table.name || !Array.isArray(table.fields)) {
          throw new Error('Invalid table structure');
        }

        // Add common fields if not present
        const hasIdField = table.fields.some((f: any) => f.name === 'id');
        const hasCreatedAt = table.fields.some((f: any) => f.name === 'created_at');
        const hasUpdatedAt = table.fields.some((f: any) => f.name === 'updated_at');

        if (!hasIdField) {
          table.fields.unshift({
            id: 'id',
            name: 'id',
            type: 'string',
            required: true,
            unique: true,
            description: 'Primary key'
          });
        }

        if (!hasCreatedAt) {
          table.fields.push({
            id: 'created_at',
            name: 'created_at',
            type: 'date',
            required: true,
            unique: false,
            description: 'Record creation timestamp'
          });
        }

        if (!hasUpdatedAt) {
          table.fields.push({
            id: 'updated_at',
            name: 'updated_at',
            type: 'date',
            required: false,
            unique: false,
            description: 'Record update timestamp'
          });
        }
      });

      return res.status(200).json({
        success: true,
        schema: schemaData,
        projectId,
        timestamp: new Date().toISOString()
      });

    } catch (parseError) {
      console.error('Schema parsing error:', parseError);
      return res.status(500).json({
        message: 'Failed to parse generated schema',
        error: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      });
    }

  } catch (error) {
    console.error('Database schema generation error:', error);
    return res.status(500).json({
      message: 'Database schema generation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}