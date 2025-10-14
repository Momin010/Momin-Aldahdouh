import type { DatabaseTable, DatabaseSchema, DatabaseConnection } from '../types';

// Mock database tables for demonstration
const MOCK_TABLES: DatabaseTable[] = [
  {
    id: 'users',
    name: 'users',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
      { name: 'email', type: 'varchar(255)', nullable: false, unique: true },
      { name: 'name', type: 'varchar(100)', nullable: false },
      { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
    ],
    indexes: [
      { name: 'users_email_idx', columns: ['email'], unique: true },
      { name: 'users_created_at_idx', columns: ['created_at'] }
    ],
    rowCount: 1250
  },
  {
    id: 'projects',
    name: 'projects',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
      { name: 'user_id', type: 'uuid', nullable: false, foreignKey: { table: 'users', column: 'id' } },
      { name: 'name', type: 'varchar(200)', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'status', type: 'enum(published,draft,archived)', nullable: false, default: 'draft' },
      { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
    ],
    indexes: [
      { name: 'projects_user_id_idx', columns: ['user_id'] },
      { name: 'projects_status_idx', columns: ['status'] }
    ],
    rowCount: 89
  },
  {
    id: 'messages',
    name: 'messages',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
      { name: 'project_id', type: 'uuid', nullable: false, foreignKey: { table: 'projects', column: 'id' } },
      { name: 'role', type: 'enum(user,model,system)', nullable: false },
      { name: 'content', type: 'text', nullable: false },
      { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
    ],
    indexes: [
      { name: 'messages_project_id_idx', columns: ['project_id'] },
      { name: 'messages_created_at_idx', columns: ['created_at'] }
    ],
    rowCount: 2341
  }
];

const MOCK_CONNECTIONS: DatabaseConnection[] = [
  {
    id: 'main-db',
    name: 'MominAI Main Database',
    host: 'localhost',
    port: 5432,
    database: 'mominai_db',
    username: 'mominai_user',
    status: 'connected',
    tables: MOCK_TABLES
  }
];

class MockDatabaseService {
  private tables: DatabaseTable[] = [...MOCK_TABLES];
  private connections: DatabaseConnection[] = [...MOCK_CONNECTIONS];

  // Simulate connection to database
  async connect(config: any): Promise<DatabaseConnection> {
    console.log('🔌 [MOCK] Connecting to database:', config);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const connection: DatabaseConnection = {
      id: `mock-${Date.now()}`,
      name: config.name || 'Mock Database',
      host: config.host || 'localhost',
      port: config.port || 5432,
      database: config.database || 'mock_db',
      username: config.username || 'mock_user',
      status: 'connected',
      tables: this.tables
    };

    this.connections.push(connection);
    return connection;
  }

  // Get all connections
  async getConnections(): Promise<DatabaseConnection[]> {
    console.log('📋 [MOCK] Getting database connections');
    return this.connections;
  }

  // Get tables for a connection
  async getTables(connectionId: string): Promise<DatabaseTable[]> {
    console.log('📊 [MOCK] Getting tables for connection:', connectionId);
    const connection = this.connections.find(c => c.id === connectionId);
    return connection?.tables || [];
  }

  // Create a new table
  async createTable(connectionId: string, tableData: Partial<DatabaseTable>): Promise<DatabaseTable> {
    console.log('➕ [MOCK] Creating table:', tableData);

    const newTable: DatabaseTable = {
      id: tableData.name || `table_${Date.now()}`,
      name: tableData.name || 'new_table',
      columns: tableData.columns || [
        { name: 'id', type: 'uuid', primaryKey: true, nullable: false }
      ],
      indexes: tableData.indexes || [],
      rowCount: 0
    };

    // Add to mock data
    this.tables.push(newTable);

    // Update connection
    const connection = this.connections.find(c => c.id === connectionId);
    if (connection) {
      connection.tables = this.tables;
    }

    return newTable;
  }

  // Update table schema
  async updateTable(connectionId: string, tableId: string, updates: Partial<DatabaseTable>): Promise<DatabaseTable> {
    console.log('✏️ [MOCK] Updating table:', tableId, updates);

    const tableIndex = this.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) {
      throw new Error('Table not found');
    }

    this.tables[tableIndex] = { ...this.tables[tableIndex], ...updates };
    return this.tables[tableIndex];
  }

  // Delete table
  async deleteTable(connectionId: string, tableId: string): Promise<void> {
    console.log('🗑️ [MOCK] Deleting table:', tableId);

    this.tables = this.tables.filter(t => t.id !== tableId);

    // Update connection
    const connection = this.connections.find(c => c.id === connectionId);
    if (connection) {
      connection.tables = this.tables;
    }
  }

  // Generate SQL schema
  async generateSQLSchema(connectionId: string): Promise<string> {
    console.log('📝 [MOCK] Generating SQL schema');

    const tables = await this.getTables(connectionId);
    let sql = '-- MominAI Database Schema\n-- Generated: ' + new Date().toISOString() + '\n\n';

    tables.forEach(table => {
      sql += `-- Table: ${table.name}\n`;
      sql += `CREATE TABLE ${table.name} (\n`;

      table.columns.forEach((col, index) => {
        sql += `  ${col.name} ${col.type}`;
        if (col.primaryKey) sql += ' PRIMARY KEY';
        if (!col.nullable) sql += ' NOT NULL';
        if (col.unique) sql += ' UNIQUE';
        if (col.default) sql += ` DEFAULT ${col.default}`;
        if (col.foreignKey) {
          sql += ` REFERENCES ${col.foreignKey.table}(${col.foreignKey.column})`;
        }
        if (index < table.columns.length - 1) sql += ',';
        sql += '\n';
      });

      sql += ');\n\n';

      // Add indexes
      table.indexes.forEach(index => {
        sql += `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${index.name} ON ${table.name} (${index.columns.join(', ')});\n`;
      });

      sql += '\n';
    });

    return sql;
  }

  // Export database data
  async exportDatabase(connectionId: string): Promise<any> {
    console.log('📤 [MOCK] Exporting database');

    const tables = await this.getTables(connectionId);
    const exportData = {
      connection: this.connections.find(c => c.id === connectionId),
      tables: tables,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    return exportData;
  }

  // Get database status
  async getStatus(connectionId: string): Promise<any> {
    console.log('📊 [MOCK] Getting database status');

    const connection = this.connections.find(c => c.id === connectionId);
    const tables = await this.getTables(connectionId);

    return {
      connection: connection,
      tableCount: tables.length,
      totalRows: tables.reduce((sum, table) => sum + table.rowCount, 0),
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
      uptime: '99.9%',
      version: 'PostgreSQL 15.0 (Mock)'
    };
  }

  // Backup database
  async backupDatabase(connectionId: string): Promise<any> {
    console.log('💾 [MOCK] Creating database backup');

    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      backupId: `backup_${Date.now()}`,
      size: '45.2 MB',
      createdAt: new Date().toISOString(),
      status: 'completed'
    };
  }

  // Execute raw SQL (mock)
  async executeSQL(connectionId: string, sql: string): Promise<any> {
    console.log('⚡ [MOCK] Executing SQL:', sql);

    // Simulate SQL execution
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      affectedRows: Math.floor(Math.random() * 100),
      executionTime: Math.random() * 1000,
      result: 'Query executed successfully (MOCK)'
    };
  }
}

export const mockDatabaseService = new MockDatabaseService();