export interface DatabaseTable {
  id: string;
  name: string;
  description: string;
  fields: DatabaseField[];
  records: Record<string, any>[];
}

export interface DatabaseField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'text' | 'json';
  required: boolean;
  unique: boolean;
  defaultValue?: any;
  description?: string;
}

export interface DatabaseConfig {
  name: string;
  tables: DatabaseTable[];
  relationships?: DatabaseRelationship[];
}

export interface DatabaseRelationship {
  id: string;
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export class DatabaseService {
  private databases: Map<string, DatabaseConfig> = new Map();
  private currentDbId: string | null = null;

  // Create a new database
  createDatabase(name: string, template?: string): string {
    const dbId = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let tables: DatabaseTable[] = [];

    // Apply template if specified
    switch (template) {
      case 'ecommerce':
        tables = this.getEcommerceTables();
        break;
      case 'blog':
        tables = this.getBlogTables();
        break;
      case 'user-management':
        tables = this.getUserManagementTables();
        break;
      default:
        tables = this.getDefaultTables();
    }

    const database: DatabaseConfig = {
      name,
      tables
    };

    this.databases.set(dbId, database);
    this.currentDbId = dbId;

    return dbId;
  }

  // Get default tables for new database
  private getDefaultTables(): DatabaseTable[] {
    return [
      {
        id: 'users',
        name: 'Users',
        description: 'User accounts and profiles',
        fields: [
          {
            id: 'id',
            name: 'id',
            type: 'string',
            required: true,
            unique: true,
            description: 'Unique identifier'
          },
          {
            id: 'email',
            name: 'email',
            type: 'string',
            required: true,
            unique: true,
            description: 'User email address'
          },
          {
            id: 'name',
            name: 'name',
            type: 'string',
            required: true,
            unique: false,
            description: 'Full name'
          },
          {
            id: 'created_at',
            name: 'created_at',
            type: 'date',
            required: true,
            unique: false,
            description: 'Account creation date'
          }
        ],
        records: []
      }
    ];
  }

  // E-commerce tables
  private getEcommerceTables(): DatabaseTable[] {
    return [
      {
        id: 'products',
        name: 'Products',
        description: 'Product catalog',
        fields: [
          { id: 'id', name: 'id', type: 'string', required: true, unique: true },
          { id: 'name', name: 'name', type: 'string', required: true, unique: false },
          { id: 'description', name: 'description', type: 'text', required: false, unique: false },
          { id: 'price', name: 'price', type: 'number', required: true, unique: false },
          { id: 'image_url', name: 'image_url', type: 'string', required: false, unique: false },
          { id: 'category', name: 'category', type: 'string', required: true, unique: false },
          { id: 'stock_quantity', name: 'stock_quantity', type: 'number', required: true, unique: false, defaultValue: 0 }
        ],
        records: []
      },
      {
        id: 'orders',
        name: 'Orders',
        description: 'Customer orders',
        fields: [
          { id: 'id', name: 'id', type: 'string', required: true, unique: true },
          { id: 'customer_id', name: 'customer_id', type: 'string', required: true, unique: false },
          { id: 'total_amount', name: 'total_amount', type: 'number', required: true, unique: false },
          { id: 'status', name: 'status', type: 'string', required: true, unique: false, defaultValue: 'pending' },
          { id: 'created_at', name: 'created_at', type: 'date', required: true, unique: false }
        ],
        records: []
      }
    ];
  }

  // Blog tables
  private getBlogTables(): DatabaseTable[] {
    return [
      {
        id: 'posts',
        name: 'Posts',
        description: 'Blog posts',
        fields: [
          { id: 'id', name: 'id', type: 'string', required: true, unique: true },
          { id: 'title', name: 'title', type: 'string', required: true, unique: false },
          { id: 'content', name: 'content', type: 'text', required: true, unique: false },
          { id: 'author_id', name: 'author_id', type: 'string', required: true, unique: false },
          { id: 'published_at', name: 'published_at', type: 'date', required: false, unique: false },
          { id: 'tags', name: 'tags', type: 'json', required: false, unique: false }
        ],
        records: []
      },
      {
        id: 'comments',
        name: 'Comments',
        description: 'Post comments',
        fields: [
          { id: 'id', name: 'id', type: 'string', required: true, unique: true },
          { id: 'post_id', name: 'post_id', type: 'string', required: true, unique: false },
          { id: 'author_name', name: 'author_name', type: 'string', required: true, unique: false },
          { id: 'content', name: 'content', type: 'text', required: true, unique: false },
          { id: 'created_at', name: 'created_at', type: 'date', required: true, unique: false }
        ],
        records: []
      }
    ];
  }

  // User management tables
  private getUserManagementTables(): DatabaseTable[] {
    return [
      {
        id: 'users',
        name: 'Users',
        description: 'User accounts',
        fields: [
          { id: 'id', name: 'id', type: 'string', required: true, unique: true },
          { id: 'email', name: 'email', type: 'string', required: true, unique: true },
          { id: 'password_hash', name: 'password_hash', type: 'string', required: true, unique: false },
          { id: 'role', name: 'role', type: 'string', required: true, unique: false, defaultValue: 'user' },
          { id: 'created_at', name: 'created_at', type: 'date', required: true, unique: false },
          { id: 'last_login', name: 'last_login', type: 'date', required: false, unique: false }
        ],
        records: []
      },
      {
        id: 'sessions',
        name: 'Sessions',
        description: 'User sessions',
        fields: [
          { id: 'id', name: 'id', type: 'string', required: true, unique: true },
          { id: 'user_id', name: 'user_id', type: 'string', required: true, unique: false },
          { id: 'token', name: 'token', type: 'string', required: true, unique: true },
          { id: 'expires_at', name: 'expires_at', type: 'date', required: true, unique: false },
          { id: 'created_at', name: 'created_at', type: 'date', required: true, unique: false }
        ],
        records: []
      }
    ];
  }

  // Get current database
  getCurrentDatabase(): DatabaseConfig | null {
    return this.currentDbId ? this.databases.get(this.currentDbId) || null : null;
  }

  // Get database by ID
  getDatabase(dbId: string): DatabaseConfig | null {
    return this.databases.get(dbId) || null;
  }

  // Add table to database
  addTable(table: Omit<DatabaseTable, 'id' | 'records'>): string {
    const db = this.getCurrentDatabase();
    if (!db) throw new Error('No current database');

    const tableId = `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTable: DatabaseTable = {
      ...table,
      id: tableId,
      records: []
    };

    db.tables.push(newTable);
    this.saveDatabase(db);

    return tableId;
  }

  // Add field to table
  addField(tableId: string, field: Omit<DatabaseField, 'id'>): string {
    const db = this.getCurrentDatabase();
    if (!db) throw new Error('No current database');

    const table = db.tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table not found');

    const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newField: DatabaseField = {
      ...field,
      id: fieldId
    };

    table.fields.push(newField);
    this.saveDatabase(db);

    return fieldId;
  }

  // Add record to table
  addRecord(tableId: string, record: Record<string, any>): string {
    const db = this.getCurrentDatabase();
    if (!db) throw new Error('No current database');

    const table = db.tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table not found');

    const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRecord = {
      id: recordId,
      ...record,
      created_at: new Date().toISOString()
    };

    table.records.push(newRecord);
    this.saveDatabase(db);

    return recordId;
  }

  // Update record
  updateRecord(tableId: string, recordId: string, updates: Record<string, any>): boolean {
    const db = this.getCurrentDatabase();
    if (!db) throw new Error('No current database');

    const table = db.tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table not found');

    const recordIndex = table.records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) throw new Error('Record not found');

    table.records[recordIndex] = {
      ...table.records[recordIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveDatabase(db);
    return true;
  }

  // Delete record
  deleteRecord(tableId: string, recordId: string): boolean {
    const db = this.getCurrentDatabase();
    if (!db) throw new Error('No current database');

    const table = db.tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table not found');

    const recordIndex = table.records.findIndex(r => r.id === recordId);
    if (recordIndex === -1) throw new Error('Record not found');

    table.records.splice(recordIndex, 1);
    this.saveDatabase(db);

    return true;
  }

  // Query records with filters
  queryRecords(tableId: string, filters?: Record<string, any>): Record<string, any>[] {
    const db = this.getCurrentDatabase();
    if (!db) throw new Error('No current database');

    const table = db.tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table not found');

    let records = [...table.records];

    if (filters) {
      records = records.filter(record => {
        return Object.entries(filters).every(([key, value]) => {
          return record[key] === value;
        });
      });
    }

    return records;
  }

  // Generate SQL schema
  generateSQLSchema(): string {
    const db = this.getCurrentDatabase();
    if (!db) throw new Error('No current database');

    let sql = `-- Database: ${db.name}\n\n`;

    db.tables.forEach(table => {
      sql += `CREATE TABLE ${table.name} (\n`;

      table.fields.forEach((field, index) => {
        const isLast = index === table.fields.length - 1;
        let fieldSQL = `  ${field.name} `;

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
            fieldSQL += 'TIMESTAMP';
            break;
          case 'text':
            fieldSQL += 'TEXT';
            break;
          case 'json':
            fieldSQL += 'JSON';
            break;
        }

        if (field.required) fieldSQL += ' NOT NULL';
        if (field.unique) fieldSQL += ' UNIQUE';
        if (field.defaultValue !== undefined) {
          fieldSQL += ` DEFAULT ${typeof field.defaultValue === 'string' ? `'${field.defaultValue}'` : field.defaultValue}`;
        }

        if (!isLast) fieldSQL += ',';
        fieldSQL += '\n';

        sql += fieldSQL;
      });

      sql += `);\n\n`;
    });

    return sql;
  }

  // Generate TypeScript interfaces
  generateTypeScriptInterfaces(): string {
    const db = this.getCurrentDatabase();
    if (!db) throw new Error('No current database');

    let ts = `// Generated TypeScript interfaces for ${db.name}\n\n`;

    db.tables.forEach(table => {
      ts += `export interface ${this.capitalizeFirst(table.name)} {\n`;

      table.fields.forEach(field => {
        let type: string;
        switch (field.type) {
          case 'string':
          case 'text':
            type = 'string';
            break;
          case 'number':
            type = 'number';
            break;
          case 'boolean':
            type = 'boolean';
            break;
          case 'date':
            type = 'Date';
            break;
          case 'json':
            type = 'any';
            break;
          default:
            type = 'any';
        }

        if (!field.required) type += ' | null | undefined';

        ts += `  ${field.name}: ${type};\n`;
      });

      ts += `}\n\n`;
    });

    return ts;
  }

  // Export database as JSON
  exportDatabase(): string {
    const db = this.getCurrentDatabase();
    if (!db) throw new Error('No current database');

    return JSON.stringify(db, null, 2);
  }

  // Import database from JSON
  importDatabase(jsonData: string): boolean {
    try {
      const db: DatabaseConfig = JSON.parse(jsonData);
      const dbId = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.databases.set(dbId, db);
      this.currentDbId = dbId;

      return true;
    } catch (error) {
      throw new Error('Invalid database JSON format');
    }
  }

  // Save database to localStorage
  private saveDatabase(db: DatabaseConfig): void {
    if (typeof window !== 'undefined' && this.currentDbId) {
      localStorage.setItem(`mominai_db_${this.currentDbId}`, JSON.stringify(db));
    }
  }

  // Load database from localStorage
  loadDatabase(dbId: string): boolean {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`mominai_db_${dbId}`);
      if (saved) {
        try {
          const db = JSON.parse(saved);
          this.databases.set(dbId, db);
          this.currentDbId = dbId;
          return true;
        } catch (error) {
          console.error('Failed to load database:', error);
        }
      }
    }
    return false;
  }

  // Helper function
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Singleton instance
export const databaseService = new DatabaseService();