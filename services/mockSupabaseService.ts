import type { SupabaseProject, SupabaseTable, DatabaseColumn } from '../types';

// Mock Supabase projects
const MOCK_PROJECTS: SupabaseProject[] = [
  {
    id: 'project_001',
    name: 'MominAI Database',
    databaseUrl: 'postgresql://postgres:password@localhost:54322/postgres',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_anon_key',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_service_role_key',
    status: 'active',
    tables: [
      {
        id: 'users',
        name: 'users',
        schema: 'public',
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
          { name: 'email', type: 'varchar(255)', nullable: false, unique: true },
          { name: 'name', type: 'varchar(100)', nullable: false },
          { name: 'created_at', type: 'timestamp with time zone', nullable: false, default: 'now()' },
          { name: 'updated_at', type: 'timestamp with time zone', nullable: false, default: 'now()' }
        ],
        rowCount: 1250,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'projects',
        name: 'projects',
        schema: 'public',
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
          { name: 'user_id', type: 'uuid', nullable: false },
          { name: 'name', type: 'varchar(200)', nullable: false },
          { name: 'description', type: 'text', nullable: true },
          { name: 'status', type: 'text', nullable: false, default: 'draft' },
          { name: 'created_at', type: 'timestamp with time zone', nullable: false, default: 'now()' },
          { name: 'updated_at', type: 'timestamp with time zone', nullable: false, default: 'now()' }
        ],
        rowCount: 89,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

// Mock data for tables
const MOCK_TABLE_DATA = {
  users: [
    { id: 'user_001', email: 'john@example.com', name: 'John Doe', created_at: '2024-01-15T10:30:00Z' },
    { id: 'user_002', email: 'jane@example.com', name: 'Jane Smith', created_at: '2024-01-20T14:15:00Z' },
    { id: 'user_003', email: 'bob@example.com', name: 'Bob Johnson', created_at: '2024-02-01T09:45:00Z' }
  ],
  projects: [
    { id: 'proj_001', user_id: 'user_001', name: 'Portfolio Website', description: 'Personal portfolio', status: 'published', created_at: '2024-01-16T11:00:00Z' },
    { id: 'proj_002', user_id: 'user_002', name: 'E-commerce Store', description: 'Online shop', status: 'draft', created_at: '2024-01-25T16:30:00Z' }
  ]
};

class MockSupabaseService {
  private projects: SupabaseProject[] = [...MOCK_PROJECTS];
  private tableData: Record<string, any[]> = { ...MOCK_TABLE_DATA };

  // Initialize Supabase client
  async initialize(url: string, anonKey: string): Promise<void> {
    console.log('🔌 [MOCK] Initializing Supabase client');

    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('✅ [MOCK] Supabase client initialized');
  }

  // Get all projects
  async getProjects(): Promise<SupabaseProject[]> {
    console.log('📋 [MOCK] Getting Supabase projects');
    return this.projects;
  }

  // Create new project
  async createProject(name: string, options: any = {}): Promise<SupabaseProject> {
    console.log('➕ [MOCK] Creating Supabase project:', name);

    // Simulate project creation
    await new Promise(resolve => setTimeout(resolve, 3000));

    const newProject: SupabaseProject = {
      id: `project_${Date.now()}`,
      name: name,
      databaseUrl: `postgresql://postgres:password@localhost:${54322 + Math.floor(Math.random() * 100)}/postgres`,
      anonKey: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_anon_key_${Date.now()}`,
      serviceRoleKey: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_service_role_key_${Date.now()}`,
      status: 'active',
      tables: []
    };

    this.projects.push(newProject);
    return newProject;
  }

  // Get project details
  async getProject(projectId: string): Promise<SupabaseProject> {
    console.log('📖 [MOCK] Getting project details:', projectId);

    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  // Get tables for project
  async getTables(projectId: string): Promise<SupabaseTable[]> {
    console.log('📊 [MOCK] Getting tables for project:', projectId);

    const project = this.projects.find(p => p.id === projectId);
    return project?.tables || [];
  }

  // Create table
  async createTable(projectId: string, tableData: {
    name: string;
    columns: DatabaseColumn[];
    schema?: string;
  }): Promise<SupabaseTable> {
    console.log('➕ [MOCK] Creating table:', tableData.name, 'in project:', projectId);

    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const newTable: SupabaseTable = {
      id: tableData.name,
      name: tableData.name,
      schema: tableData.schema || 'public',
      columns: tableData.columns,
      rowCount: 0,
      createdAt: new Date().toISOString()
    };

    project.tables.push(newTable);
    this.tableData[tableData.name] = [];

    return newTable;
  }

  // Update table
  async updateTable(projectId: string, tableId: string, updates: Partial<SupabaseTable>): Promise<SupabaseTable> {
    console.log('✏️ [MOCK] Updating table:', tableId, 'in project:', projectId);

    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const tableIndex = project.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) {
      throw new Error('Table not found');
    }

    project.tables[tableIndex] = { ...project.tables[tableIndex], ...updates };
    return project.tables[tableIndex];
  }

  // Delete table
  async deleteTable(projectId: string, tableId: string): Promise<void> {
    console.log('🗑️ [MOCK] Deleting table:', tableId, 'from project:', projectId);

    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    project.tables = project.tables.filter(t => t.id !== tableId);
    delete this.tableData[tableId];
  }

  // Query table data
  async queryTable(projectId: string, tableName: string, options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    filters?: Record<string, any>;
  } = {}): Promise<{ data: any[]; count: number }> {
    console.log('🔍 [MOCK] Querying table:', tableName, 'with options:', options);

    const data = this.tableData[tableName] || [];
    let filteredData = [...data];

    // Apply filters
    if (options.filters) {
      filteredData = filteredData.filter(row => {
        return Object.entries(options.filters!).every(([key, value]) => {
          return row[key] === value;
        });
      });
    }

    // Apply ordering
    if (options.orderBy) {
      filteredData.sort((a, b) => {
        const aVal = a[options.orderBy!];
        const bVal = b[options.orderBy!];
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      });
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || filteredData.length;
    const paginatedData = filteredData.slice(offset, offset + limit);

    return {
      data: paginatedData,
      count: filteredData.length
    };
  }

  // Insert data into table
  async insertData(projectId: string, tableName: string, data: Record<string, any>[]): Promise<any[]> {
    console.log('📥 [MOCK] Inserting data into table:', tableName);

    if (!this.tableData[tableName]) {
      this.tableData[tableName] = [];
    }

    const insertedData = data.map(row => ({
      ...row,
      id: row.id || `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    this.tableData[tableName].push(...insertedData);

    // Update row count in project
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      const table = project.tables.find(t => t.name === tableName);
      if (table) {
        table.rowCount = this.tableData[tableName].length;
      }
    }

    return insertedData;
  }

  // Update data in table
  async updateData(projectId: string, tableName: string, id: string, updates: Record<string, any>): Promise<any> {
    console.log('📝 [MOCK] Updating data in table:', tableName, 'id:', id);

    const tableData = this.tableData[tableName];
    if (!tableData) {
      throw new Error('Table not found');
    }

    const rowIndex = tableData.findIndex(row => row.id === id);
    if (rowIndex === -1) {
      throw new Error('Row not found');
    }

    tableData[rowIndex] = {
      ...tableData[rowIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return tableData[rowIndex];
  }

  // Delete data from table
  async deleteData(projectId: string, tableName: string, id: string): Promise<void> {
    console.log('🗑️ [MOCK] Deleting data from table:', tableName, 'id:', id);

    const tableData = this.tableData[tableName];
    if (!tableData) {
      throw new Error('Table not found');
    }

    const rowIndex = tableData.findIndex(row => row.id === id);
    if (rowIndex === -1) {
      throw new Error('Row not found');
    }

    tableData.splice(rowIndex, 1);

    // Update row count in project
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      const table = project.tables.find(t => t.name === tableName);
      if (table) {
        table.rowCount = tableData.length;
      }
    }
  }

  // Get real-time subscription (mock)
  async subscribeToTable(tableName: string, callback: (payload: any) => void): Promise<() => void> {
    console.log('📡 [MOCK] Subscribing to table:', tableName);

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every 5 seconds
        callback({
          eventType: 'INSERT',
          new: {
            id: `mock_${Date.now()}`,
            message: 'New mock data inserted',
            timestamp: new Date().toISOString()
          },
          table: tableName
        });
      }
    }, 5000);

    // Return unsubscribe function
    return () => {
      clearInterval(interval);
      console.log('📡 [MOCK] Unsubscribed from table:', tableName);
    };
  }

  // Execute raw SQL
  async executeSQL(projectId: string, sql: string): Promise<any> {
    console.log('⚡ [MOCK] Executing SQL:', sql);

    // Simulate SQL execution
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      affectedRows: Math.floor(Math.random() * 100) + 1,
      executionTime: Math.random() * 1000,
      result: 'Query executed successfully (MOCK)'
    };
  }

  // Get database statistics
  async getDatabaseStats(projectId: string): Promise<any> {
    console.log('📊 [MOCK] Getting database statistics');

    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const totalRows = project.tables.reduce((sum, table) => sum + table.rowCount, 0);

    return {
      totalTables: project.tables.length,
      totalRows: totalRows,
      databaseSize: `${(Math.random() * 100 + 10).toFixed(1)} MB`,
      connections: Math.floor(Math.random() * 50) + 10,
      uptime: '99.9%',
      version: 'PostgreSQL 15.0 (Supabase)'
    };
  }

  // Backup database
  async backupDatabase(projectId: string): Promise<any> {
    console.log('💾 [MOCK] Creating database backup');

    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      backupId: `backup_${Date.now()}`,
      size: `${(Math.random() * 50 + 10).toFixed(1)} MB`,
      downloadUrl: `https://mock-supabase-backups.com/backup_${Date.now()}.sql`,
      createdAt: new Date().toISOString()
    };
  }

  // Authenticate user (mock)
  async signIn(email: string, password: string): Promise<any> {
    console.log('🔐 [MOCK] Signing in user:', email);

    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      user: {
        id: 'user_mock_001',
        email: email,
        name: email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      },
      session: {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_at: Date.now() + 3600000 // 1 hour
      }
    };
  }

  // Sign up user (mock)
  async signUp(email: string, password: string, metadata?: any): Promise<any> {
    console.log('📝 [MOCK] Signing up user:', email);

    // Simulate registration
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      user: {
        id: `user_${Date.now()}`,
        email: email,
        name: metadata?.name || email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      },
      session: null // Email confirmation required
    };
  }

  // Sign out
  async signOut(): Promise<void> {
    console.log('🚪 [MOCK] Signing out user');
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Get current user
  async getCurrentUser(): Promise<any> {
    console.log('👤 [MOCK] Getting current user');

    return {
      id: 'user_mock_001',
      email: 'demo@mominai.com',
      name: 'Demo User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
    };
  }
}

export const mockSupabaseService = new MockSupabaseService();