import { supabaseManager, getSupabaseClient } from '../lib/supabase';

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  rowCount?: number;
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKey?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface DatabaseSchema {
  tables: DatabaseTable[];
  relationships: DatabaseRelationship[];
}

export interface DatabaseRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface GeneratedSchema {
  sql: string;
  tables: DatabaseTable[];
  explanation: string;
}

class SupabaseService {
  // Generate database schema from HTML content
  async generateSchemaFromHtml(htmlContent: string): Promise<GeneratedSchema> {
    // Parse HTML to identify data structures
    const tables = this.extractTablesFromHtml(htmlContent);

    // Generate SQL schema
    const sql = this.generateSqlSchema(tables);

    return {
      sql,
      tables,
      explanation: `Generated database schema with ${tables.length} tables based on HTML content analysis.`
    };
  }

  // Extract potential database tables from HTML content
  private extractTablesFromHtml(htmlContent: string): DatabaseTable[] {
    const tables: DatabaseTable[] = [];

    // Look for common patterns that indicate data structures
    const forms = this.extractFormsFromHtml(htmlContent);
    const lists = this.extractListsFromHtml(htmlContent);
    const cards = this.extractCardsFromHtml(htmlContent);

    // Convert forms to user/auth tables
    if (forms.length > 0) {
      tables.push({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, primaryKey: true, defaultValue: 'gen_random_uuid()' },
          { name: 'email', type: 'varchar(255)', nullable: false },
          { name: 'password_hash', type: 'varchar(255)', nullable: true },
          { name: 'full_name', type: 'varchar(255)', nullable: true },
          { name: 'avatar_url', type: 'varchar(500)', nullable: true },
          { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
          { name: 'updated_at', type: 'timestamp', nullable: false, defaultValue: 'now()' }
        ]
      });

      tables.push({
        name: 'user_sessions',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, primaryKey: true, defaultValue: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', nullable: false, foreignKey: { table: 'users', column: 'id' } },
          { name: 'session_token', type: 'varchar(255)', nullable: false },
          { name: 'expires_at', type: 'timestamp', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()' }
        ]
      });
    }

    // Convert lists/cards to content tables
    if (lists.length > 0 || cards.length > 0) {
      const contentItems = Math.max(lists.length, cards.length);

      tables.push({
        name: 'posts',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, primaryKey: true, defaultValue: 'gen_random_uuid()' },
          { name: 'title', type: 'varchar(500)', nullable: false },
          { name: 'content', type: 'text', nullable: true },
          { name: 'excerpt', type: 'varchar(500)', nullable: true },
          { name: 'slug', type: 'varchar(255)', nullable: false },
          { name: 'author_id', type: 'uuid', nullable: false, foreignKey: { table: 'users', column: 'id' } },
          { name: 'status', type: 'varchar(50)', nullable: false, defaultValue: "'draft'" },
          { name: 'published_at', type: 'timestamp', nullable: true },
          { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()' },
          { name: 'updated_at', type: 'timestamp', nullable: false, defaultValue: 'now()' }
        ]
      });

      tables.push({
        name: 'categories',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, primaryKey: true, defaultValue: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar(255)', nullable: false },
          { name: 'slug', type: 'varchar(255)', nullable: false },
          { name: 'description', type: 'text', nullable: true },
          { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()' }
        ]
      });

      tables.push({
        name: 'post_categories',
        columns: [
          { name: 'id', type: 'uuid', nullable: false, primaryKey: true, defaultValue: 'gen_random_uuid()' },
          { name: 'post_id', type: 'uuid', nullable: false, foreignKey: { table: 'posts', column: 'id' } },
          { name: 'category_id', type: 'uuid', nullable: false, foreignKey: { table: 'categories', column: 'id' } }
        ]
      });
    }

    return tables;
  }

  // Extract forms from HTML
  private extractFormsFromHtml(htmlContent: string): any[] {
    const forms: any[] = [];
    // Simple regex to find form elements
    const formRegex = /<form[^>]*>[\s\S]*?<\/form>/gi;
    const matches = htmlContent.match(formRegex) || [];
    return matches.map(match => ({ html: match }));
  }

  // Extract lists from HTML
  private extractListsFromHtml(htmlContent: string): any[] {
    const lists: any[] = [];
    const listRegex = /<(ul|ol)[^>]*>[\s\S]*?<\/\1>/gi;
    const matches = htmlContent.match(listRegex) || [];
    return matches.map(match => ({ html: match }));
  }

  // Extract cards/components from HTML
  private extractCardsFromHtml(htmlContent: string): any[] {
    const cards: any[] = [];
    // Look for common card patterns
    const cardRegex = /<div[^>]*(?:card|article|post|item)[^>]*>[\s\S]*?<\/div>/gi;
    const matches = htmlContent.match(cardRegex) || [];
    return matches.map(match => ({ html: match }));
  }

  // Generate SQL schema from tables
  private generateSqlSchema(tables: DatabaseTable[]): string {
    let sql = '-- Generated by MominAI\n\n';

    // Enable UUID extension
    sql += '-- Enable UUID extension\n';
    sql += 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n';

    // Create tables
    tables.forEach(table => {
      sql += `-- Create ${table.name} table\n`;
      sql += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;

      const columnDefinitions = table.columns.map(col => {
        let def = `  ${col.name} ${col.type}`;

        if (!col.nullable) def += ' NOT NULL';
        if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
        if (col.primaryKey) def += ' PRIMARY KEY';

        return def;
      });

      sql += columnDefinitions.join(',\n');
      sql += '\n);\n\n';

      // Add indexes for foreign keys
      table.columns.forEach(col => {
        if (col.foreignKey) {
          sql += `CREATE INDEX IF NOT EXISTS idx_${table.name}_${col.name} ON ${table.name}(${col.name});\n`;
        }
      });

      sql += '\n';
    });

    // Add foreign key constraints
    tables.forEach(table => {
      table.columns.forEach(col => {
        if (col.foreignKey) {
          sql += `ALTER TABLE ${table.name} ADD CONSTRAINT fk_${table.name}_${col.name} `;
          sql += `FOREIGN KEY (${col.name}) REFERENCES ${col.foreignKey.table}(${col.foreignKey.column});\n`;
        }
      });
    });

    return sql;
  }

  // Execute schema in Supabase
  async executeSchema(schema: GeneratedSchema): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Not connected to Supabase');

    // Split SQL into individual statements
    const statements = schema.sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        // Use raw SQL execution (this would need proper Supabase setup)
        await client.rpc('exec_sql', { sql: statement });
      } catch (error) {
        console.warn('Failed to execute statement:', statement, error);
        // Continue with other statements
      }
    }
  }

  // Get current database schema
  async getCurrentSchema(): Promise<DatabaseSchema> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Not connected to Supabase');

    try {
      // This is a simplified version - in reality you'd query PostgreSQL system tables
      const { data: tables, error } = await client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (error) throw error;

      const schema: DatabaseSchema = {
        tables: [],
        relationships: []
      };

      // Get detailed table information
      for (const table of tables || []) {
        const tableInfo = await this.getTableInfo(table.table_name);
        if (tableInfo) {
          schema.tables.push(tableInfo);
        }
      }

      return schema;
    } catch (error) {
      console.error('Failed to get schema:', error);
      return { tables: [], relationships: [] };
    }
  }

  // Get detailed table information
  private async getTableInfo(tableName: string): Promise<DatabaseTable | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      // Get column information
      const { data: columns, error } = await client
        .from('information_schema.columns')
        .select('*')
        .eq('table_name', tableName)
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (error) throw error;

      // Get row count
      const { count } = await client
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      const tableColumns: DatabaseColumn[] = (columns || []).map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        primaryKey: false // Would need to check constraints
      }));

      return {
        name: tableName,
        columns: tableColumns,
        rowCount: count || 0
      };
    } catch (error) {
      console.error(`Failed to get info for table ${tableName}:`, error);
      return null;
    }
  }

  // Insert sample data
  async insertSampleData(tableName: string, data: any[]): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Not connected to Supabase');

    const { error } = await client
      .from(tableName)
      .insert(data);

    if (error) throw error;
  }

  // Query table data
  async queryTable(tableName: string, limit: number = 100): Promise<any[]> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Not connected to Supabase');

    const { data, error } = await client
      .from(tableName)
      .select('*')
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const supabaseService = new SupabaseService();