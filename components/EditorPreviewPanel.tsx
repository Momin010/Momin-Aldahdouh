import React, { useState, useEffect, useRef } from 'react';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import LivePreview, { Device } from './LivePreview';
import VisualEditor from './VisualEditor';
import PreviewVisualEditor from './PreviewVisualEditor';
import DatabaseCanvas from './DatabaseCanvas';
import { Icon } from './Icon';
import type { Files, ConsoleMessage, PreviewChange } from '../types';
import ResizablePanel from './ResizablePanel';

interface DatabaseTable {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  columns: Array<{
    name: string;
    type: string;
    primaryKey?: boolean;
    nullable?: boolean;
  }>;
  rowCount: number;
}

interface DatabaseRelationship {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one';
}

interface EditorPreviewPanelProps {
   files: Files;
   activeFile: string;
   onSelectFile: (path: string) => void;
   onCodeChange: (newContent: string) => void;
   previewHtml: string;
   standaloneHtml: string;
   onBackToChat: () => void; // For mobile view
   onToggleFullscreen: () => void;
   consoleLogs: ConsoleMessage[];
   onNewLog: (log: ConsoleMessage) => void;
   onClearConsole: () => void;
   device: Device;
   onDeviceChange: (device: Device) => void;
   view: 'code' | 'preview' | 'database' | 'visual-editor';
   currentView: 'code' | 'preview' | 'database' | 'visual-editor';
   onDatabaseAction?: (action: string) => void;
   onVisualEditorChange?: (content: string) => void;
   isVisualEditMode?: boolean;
   onVisualEditModeChange?: (mode: boolean) => void;
   onPreviewEdit?: (change: PreviewChange) => void;
   isVisualEditorEnabled?: boolean;
   // Project state management
   workspace?: any;
   onUpdateWorkspace?: (updater: (prevWorkspace: any) => any) => void;
   activeProjectId?: string;
}

const EditorPreviewPanel: React.FC<EditorPreviewPanelProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCodeChange,
  previewHtml,
  standaloneHtml,
  onBackToChat,
  onToggleFullscreen,
  consoleLogs,
  onNewLog,
  onClearConsole,
  device,
  onDeviceChange,
  view,
  currentView,
  onDatabaseAction,
  onVisualEditorChange,
  isVisualEditMode,
  onVisualEditModeChange,
  onPreviewEdit,
  isVisualEditorEnabled,
  workspace,
  onUpdateWorkspace,
  activeProjectId,
}) => {
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Database state management - start with empty database
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([]);
  const [databaseInitialized, setDatabaseInitialized] = useState(false);

  const [databaseRelationships, setDatabaseRelationships] = useState<DatabaseRelationship[]>([]);

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);

  // Sync with workspace state when project changes (for isolation)
  const currentProject = workspace?.projects?.find((p: any) => p.id === activeProjectId);
  const workspaceTables = currentProject?.history?.versions?.[currentProject?.history?.currentIndex]?.databaseSchema?.tables || [];
  const workspaceRelationships = currentProject?.history?.versions?.[currentProject?.history?.currentIndex]?.databaseSchema?.relationships || [];

  // Database handlers
  const handleTableSelect = (table: DatabaseTable) => {
    setSelectedTable(table.id);
  };

  const handleTableMove = (tableId: string, x: number, y: number) => {
    // Update local state immediately for UI responsiveness
    setDatabaseTables(prev => prev.map(table =>
      table.id === tableId ? { ...table, x, y } : table
    ));

    // Also save to workspace state for persistence
    if (onUpdateWorkspace && activeProjectId) {
      onUpdateWorkspace((prevWorkspace: any) => {
        const newProjects = prevWorkspace.projects.map((project: any) => {
          if (project.id === activeProjectId) {
            const currentState = project.history.versions[project.history.currentIndex];
            const updatedSchema = {
              ...currentState.databaseSchema,
              tables: currentState.databaseSchema.tables.map((table: any) =>
                table.id === tableId ? { ...table, x, y } : table
              )
            };
            const newState = { ...currentState, databaseSchema: updatedSchema };
            const newVersions = project.history.versions.slice(0, project.history.currentIndex + 1);
            newVersions.push(newState);
            const newHistory = {
              versions: newVersions,
              currentIndex: newVersions.length - 1,
            };
            return { ...project, history: newHistory };
          }
          return project;
        });
        return { ...prevWorkspace, projects: newProjects };
      });
    }
  };

  const handleTableEdit = (updatedTable: DatabaseTable) => {
    // Update local state immediately for UI responsiveness
    setDatabaseTables(prev => prev.map(table =>
      table.id === updatedTable.id ? updatedTable : table
    ));

    // Also save to workspace state for persistence
    if (onUpdateWorkspace && activeProjectId) {
      onUpdateWorkspace((prevWorkspace: any) => {
        const newProjects = prevWorkspace.projects.map((project: any) => {
          if (project.id === activeProjectId) {
            const currentState = project.history.versions[project.history.currentIndex];
            const updatedSchema = {
              ...currentState.databaseSchema,
              tables: currentState.databaseSchema.tables.map((table: any) =>
                table.id === updatedTable.id ? updatedTable : table
              )
            };
            const newState = { ...currentState, databaseSchema: updatedSchema };
            const newVersions = project.history.versions.slice(0, project.history.currentIndex + 1);
            newVersions.push(newState);
            const newHistory = {
              versions: newVersions,
              currentIndex: newVersions.length - 1,
            };
            return { ...project, history: newHistory };
          }
          return project;
        });
        return { ...prevWorkspace, projects: newProjects };
      });
    }
  };

  const handleTableDelete = (tableId: string) => {
    // Update local state immediately for UI responsiveness
    setDatabaseTables(prev => prev.filter(table => table.id !== tableId));

    // Also save to workspace state for persistence
    if (onUpdateWorkspace && activeProjectId) {
      onUpdateWorkspace((prevWorkspace: any) => {
        const newProjects = prevWorkspace.projects.map((project: any) => {
          if (project.id === activeProjectId) {
            const currentState = project.history.versions[project.history.currentIndex];
            const updatedSchema = {
              ...currentState.databaseSchema,
              tables: currentState.databaseSchema.tables.filter((table: any) => table.id !== tableId)
            };
            const newState = { ...currentState, databaseSchema: updatedSchema };
            const newVersions = project.history.versions.slice(0, project.history.currentIndex + 1);
            newVersions.push(newState);
            const newHistory = {
              versions: newVersions,
              currentIndex: newVersions.length - 1,
            };
            return { ...project, history: newHistory };
          }
          return project;
        });
        return { ...prevWorkspace, projects: newProjects };
      });
    }
  };

  const handleAddTable = () => {
    console.log('handleAddTable called, current tables:', databaseTables.length);

    // Create a copy of the first available table, or create a default table if none exist
    const sourceTable = databaseTables.length > 0 ? databaseTables[0] : null;

    if (sourceTable) {
      const newTable: DatabaseTable = {
        id: `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${sourceTable.name}_copy_${Math.floor(Math.random() * 1000)}`,
        x: 100 + Math.random() * 400, // Ensure positive coordinates
        y: 100 + Math.random() * 300, // Ensure positive coordinates
        width: 250,
        height: 150,
        columns: JSON.parse(JSON.stringify(sourceTable.columns)), // Deep copy
        rowCount: 0
      };

      // Update local state immediately for UI responsiveness
      setDatabaseTables(prev => [...prev, newTable]);

      // Also save to workspace state for persistence
      if (onUpdateWorkspace && activeProjectId) {
        onUpdateWorkspace((prevWorkspace: any) => {
          const newProjects = prevWorkspace.projects.map((project: any) => {
            if (project.id === activeProjectId) {
              const currentState = project.history.versions[project.history.currentIndex];
              const updatedSchema = {
                ...currentState.databaseSchema,
                tables: [...currentState.databaseSchema.tables, newTable]
              };
              const newState = { ...currentState, databaseSchema: updatedSchema };
              const newVersions = project.history.versions.slice(0, project.history.currentIndex + 1);
              newVersions.push(newState);
              const newHistory = {
                versions: newVersions,
                currentIndex: newVersions.length - 1,
              };
              return { ...project, history: newHistory };
            }
            return project;
          });
          return { ...prevWorkspace, projects: newProjects };
        });
      }

      console.log('Added new table:', newTable.name, 'at position:', newTable.x, newTable.y);
    } else {
      // Create a default table if no tables exist
      const defaultTable: DatabaseTable = {
        id: `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `new_table_${Math.floor(Math.random() * 1000)}`,
        x: 100 + Math.random() * 400, // Ensure positive coordinates
        y: 100 + Math.random() * 300, // Ensure positive coordinates
        width: 250,
        height: 150,
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
          { name: 'name', type: 'varchar(255)', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ],
        rowCount: 0
      };

      // Update local state immediately for UI responsiveness
      setDatabaseTables(prev => [...prev, defaultTable]);

      // Also save to workspace state for persistence
      if (onUpdateWorkspace && activeProjectId) {
        onUpdateWorkspace((prevWorkspace: any) => {
          const newProjects = prevWorkspace.projects.map((project: any) => {
            if (project.id === activeProjectId) {
              const currentState = project.history.versions[project.history.currentIndex];
              const updatedSchema = {
                ...currentState.databaseSchema,
                tables: [...currentState.databaseSchema.tables, defaultTable]
              };
              const newState = { ...currentState, databaseSchema: updatedSchema };
              const newVersions = project.history.versions.slice(0, project.history.currentIndex + 1);
              newVersions.push(newState);
              const newHistory = {
                versions: newVersions,
                currentIndex: newVersions.length - 1,
              };
              return { ...project, history: newHistory };
            }
            return project;
          });
          return { ...prevWorkspace, projects: newProjects };
        });
      }

      console.log('Created default table:', defaultTable.name, 'at position:', defaultTable.x, defaultTable.y);
    }
  };

  const handleToggleFullscreen = () => {
    onToggleFullscreen();
  };

  const handleStartEditing = (tableId: string) => {
    setEditingTableId(tableId);
  };

  const handleStopEditing = () => {
    setEditingTableId(null);
  };

  const deviceButtons: { name: Device, icon: string }[] = [
    { name: 'desktop', icon: 'desktop' },
    { name: 'tablet', icon: 'tablet' },
    { name: 'mobile', icon: 'mobile' },
  ];

  const displayHtml = standaloneHtml || previewHtml;

  // Sync local state with workspace state when project changes
  useEffect(() => {
    if (workspace && activeProjectId) {
      const currentProject = workspace.projects?.find((p: any) => p.id === activeProjectId);
      const currentState = currentProject?.history?.versions?.[currentProject?.history?.currentIndex];
      const workspaceTables = currentState?.databaseSchema?.tables || [];
      const workspaceRelationships = currentState?.databaseSchema?.relationships || [];

      console.log('🔄 Syncing with workspace state - found', workspaceTables.length, 'tables');

      // Update local state to match workspace state
      setDatabaseTables(workspaceTables);
      setDatabaseRelationships(workspaceRelationships);
      setDatabaseInitialized(false); // Reset so it can be initialized again for new projects
    }
  }, [workspace, activeProjectId]);

  // Auto-populate database when standalone HTML is generated
  useEffect(() => {
    if (standaloneHtml && onUpdateWorkspace && activeProjectId) {
      console.log('🔄 Standalone HTML detected, initializing database schema...');
      console.log('📄 HTML length:', standaloneHtml.length);
      console.log('📊 Current tables before init:', databaseTables.length);

      // Clear existing database first to start fresh
      setDatabaseTables([]);
      setDatabaseRelationships([]);

      // Then initialize with new schema based on HTML content
      setTimeout(() => {
        console.log('🚀 Starting database initialization...');
        initializeDatabaseFromHTML(standaloneHtml);
        setDatabaseInitialized(true);
      }, 200);
    }
  }, [standaloneHtml, onUpdateWorkspace, activeProjectId, databaseInitialized]);

  // Function to analyze HTML and create appropriate database schema
  const initializeDatabaseFromHTML = (htmlContent: string) => {
    const tables: DatabaseTable[] = [];
    const relationships: DatabaseRelationship[] = [];

    // Detect app type from HTML content
    const isEcommerce = htmlContent.includes('product') || htmlContent.includes('cart') || htmlContent.includes('checkout');
    const hasAuth = htmlContent.includes('login') || htmlContent.includes('signup') || htmlContent.includes('auth');
    const hasBlog = htmlContent.includes('post') || htmlContent.includes('article') || htmlContent.includes('blog');

    let tableX = 100;
    const tableSpacing = 300;

    // Always create users table if auth is detected
    if (hasAuth) {
      tables.push({
        id: 'users',
        name: 'users',
        x: tableX,
        y: 100,
        width: 250,
        height: 180,
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
          { name: 'email', type: 'varchar(255)', nullable: false },
          { name: 'password', type: 'varchar(255)', nullable: false },
          { name: 'name', type: 'varchar(100)', nullable: true },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ],
        rowCount: 0 // Empty initially, populated when users sign up
      });
      tableX += tableSpacing;
    }

    // Create products table for ecommerce
    if (isEcommerce) {
      tables.push({
        id: 'products',
        name: 'products',
        x: tableX,
        y: 100,
        width: 250,
        height: 200,
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
          { name: 'name', type: 'varchar(255)', nullable: false },
          { name: 'description', type: 'text', nullable: true },
          { name: 'price', type: 'decimal(10,2)', nullable: false },
          { name: 'image_url', type: 'varchar(500)', nullable: true },
          { name: 'category', type: 'varchar(100)', nullable: true },
          { name: 'stock_quantity', type: 'integer', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ],
        rowCount: 0 // Will be populated from HTML content
      });

      // Extract products from HTML and populate the table
      populateProductsFromHTML(htmlContent, tables[tables.length - 1]);

      tableX += tableSpacing;
    }

    // Create cart/orders table for ecommerce
    if (isEcommerce && hasAuth) {
      tables.push({
        id: 'cart_items',
        name: 'cart_items',
        x: tableX,
        y: 100,
        width: 250,
        height: 160,
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
          { name: 'user_id', type: 'uuid', nullable: false },
          { name: 'product_id', type: 'uuid', nullable: false },
          { name: 'quantity', type: 'integer', nullable: false },
          { name: 'added_at', type: 'timestamp', nullable: false }
        ],
        rowCount: 0 // Populated when users add items to cart
      });
      tableX += tableSpacing;

      // Add relationships
      relationships.push(
        {
          id: 'cart_user_fk',
          fromTable: 'cart_items',
          fromColumn: 'user_id',
          toTable: 'users',
          toColumn: 'id',
          type: 'many-to-one'
        },
        {
          id: 'cart_product_fk',
          fromTable: 'cart_items',
          fromColumn: 'product_id',
          toTable: 'products',
          toColumn: 'id',
          type: 'many-to-one'
        }
      );
    }

    // Create posts/articles table for blog
    if (hasBlog && hasAuth) {
      tables.push({
        id: 'posts',
        name: 'posts',
        x: tableX,
        y: 100,
        width: 250,
        height: 180,
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
          { name: 'author_id', type: 'uuid', nullable: false },
          { name: 'title', type: 'varchar(255)', nullable: false },
          { name: 'content', type: 'text', nullable: false },
          { name: 'published_at', type: 'timestamp', nullable: true },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ],
        rowCount: 0
      });
      tableX += tableSpacing;

      relationships.push({
        id: 'post_author_fk',
        fromTable: 'posts',
        fromColumn: 'author_id',
        toTable: 'users',
        toColumn: 'id',
        type: 'many-to-one'
      });
    }

    // Create sessions table for auth
    if (hasAuth) {
      tables.push({
        id: 'sessions',
        name: 'sessions',
        x: tableX,
        y: 100,
        width: 250,
        height: 140,
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
          { name: 'user_id', type: 'uuid', nullable: false },
          { name: 'token', type: 'varchar(500)', nullable: false },
          { name: 'expires_at', type: 'timestamp', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ],
        rowCount: 0
      });

      relationships.push({
        id: 'session_user_fk',
        fromTable: 'sessions',
        fromColumn: 'user_id',
        toTable: 'users',
        toColumn: 'id',
        type: 'many-to-one'
      });
    }

    // Update local state immediately for UI responsiveness (like working version)
    console.log('🔄 Updating local database state...');
    setDatabaseTables(tables);
    setDatabaseRelationships(relationships);
    console.log('✅ Local state updated with', tables.length, 'tables and', relationships.length, 'relationships');

    // Also save to workspace state for persistence
    if (onUpdateWorkspace && activeProjectId) {
      console.log('🔄 Also updating workspace with new database schema...');
      onUpdateWorkspace((prevWorkspace: any) => {
        const newProjects = prevWorkspace.projects.map((project: any) => {
          if (project.id === activeProjectId) {
            console.log('📝 Found active project:', project.id);
            const currentState = project.history.versions[project.history.currentIndex];
            console.log('📋 Current state database tables:', currentState?.databaseSchema?.tables?.length || 0);

            const newState = {
              ...currentState,
              databaseSchema: { tables, relationships }
            };

            console.log('✨ New state with', tables.length, 'tables created');

            const newVersions = project.history.versions.slice(0, project.history.currentIndex + 1);
            newVersions.push(newState);
            const newHistory = {
              versions: newVersions,
              currentIndex: newVersions.length - 1,
            };

            console.log('💾 History updated, new version count:', newVersions.length);
            return { ...project, history: newHistory };
          }
          return project;
        });
        return { ...prevWorkspace, projects: newProjects };
      });
      console.log('💾 Workspace also updated with database schema');
    } else {
      console.error('❌ Cannot save database schema to workspace - missing onUpdateWorkspace or activeProjectId');
    }
  };

  // Function to extract products from HTML and populate products table
  const populateProductsFromHTML = (htmlContent: string, productsTable: DatabaseTable) => {
    // Look for product data in various formats

    // 1. Look for products array in script tags
    const scriptProducts = htmlContent.match(/products\s*:\s*\[([^\]]*)\]/gi);
    if (scriptProducts && scriptProducts.length > 0) {
      productsTable.rowCount = scriptProducts.length;
      console.log('Found', productsTable.rowCount, 'products in script data');
      return;
    }

    // 2. Look for individual product elements
    const productElements = htmlContent.match(/class="[^"]*product[^"]*"/gi) || [];
    if (productElements.length > 0) {
      productsTable.rowCount = productElements.length;
      console.log('Found', productsTable.rowCount, 'product elements');
      return;
    }

    // 3. Look for price indicators (common in ecommerce)
    const priceIndicators = htmlContent.match(/\$[\d,]+\.?\d*/g) || [];
    if (priceIndicators.length > 0) {
      productsTable.rowCount = Math.max(1, Math.floor(priceIndicators.length / 2)); // Estimate products from prices
      console.log('Detected', productsTable.rowCount, 'products from price indicators');
      return;
    }

    // 4. Look for cart/product related keywords
    const productKeywords = ['product', 'item', 'cart', 'shop', 'store', 'buy', 'purchase'];
    let keywordCount = 0;
    productKeywords.forEach(keyword => {
      keywordCount += (htmlContent.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
    });

    if (keywordCount > 5) {
      productsTable.rowCount = Math.max(1, Math.floor(keywordCount / 3));
      console.log('Detected', productsTable.rowCount, 'products from content analysis');
    } else {
      // Default: assume some products exist
      productsTable.rowCount = 3; // Sample data
      console.log('Defaulting to 3 sample products');
    }
  };

  // Show placeholder only when there's no content to display in preview mode
  if (!displayHtml && view === 'preview') {
    return (
      <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
        <div className="flex-grow flex items-center justify-center text-white">
          <div className="text-center">
            <Icon name="eye" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Live Preview</h3>
            <p className="text-gray-400">Your generated project preview will appear here.</p>
          </div>
        </div>
      </div>
    );
  }

  // Database View Content - Interactive Canvas
  if (view === 'database') {
    // Show connection screen if not connected
    if (!isDatabaseConnected) {
      return (
        <div className="flex flex-col h-full bg-black md:border border-white/10 md:rounded-2xl overflow-hidden">
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-6">
              {/* MominAI Logo/Icon */}
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">MominAI Database</h2>
                <p className="text-gray-400 text-sm">Connect to the cloud to access your database canvas</p>
              </div>

              {/* Connection Button */}
              <button
                onClick={() => setIsDatabaseConnected(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connect to MominAI Cloud
                </div>
              </button>

              {/* Features */}
              <div className="mt-8 grid grid-cols-1 gap-4 text-left">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Visual database design</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Auto-generate from code</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Import/Export schemas</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Project isolation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show database canvas if connected
    return (
      <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
        <div className="flex-grow overflow-hidden">
          <DatabaseCanvas
            isVisible={view === 'database'}
            onClose={() => {}}
            appState={currentProject?.history?.versions?.[currentProject?.history?.currentIndex]}
            onUpdateAppState={onUpdateWorkspace}
            tables={databaseTables}
            relationships={databaseRelationships}
            onTableSelect={handleTableSelect}
            onTableMove={handleTableMove}
            onTableEdit={handleTableEdit}
            onTableDelete={handleTableDelete}
            onAddTable={handleAddTable}
            selectedTable={selectedTable}
            onToggleFullscreen={handleToggleFullscreen}
            editingTableId={editingTableId}
            onStartEditing={handleStartEditing}
            onStopEditing={handleStopEditing}
          />
        </div>
      </div>
    );
  }

  // Visual Editor View Content
  if (view === 'visual-editor') {
    return (
      <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
        <div className="flex-grow overflow-hidden">
          <VisualEditor
            htmlContent={standaloneHtml || previewHtml || ''}
            onContentChange={onVisualEditorChange || (() => {})}
            isEditMode={isVisualEditMode || false}
            onEditModeChange={onVisualEditModeChange || (() => {})}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
      <div className="flex-grow overflow-auto relative">
        {view === 'preview' && (
          <>
            <LivePreview
              ref={previewIframeRef}
              htmlContent={displayHtml}
              device={device}
              logs={consoleLogs}
              onNewLog={onNewLog}
              onClearLogs={onClearConsole}
              isVisualEditorEnabled={isVisualEditorEnabled}
            />
            <PreviewVisualEditor
              htmlContent={displayHtml}
              onPreviewEdit={onPreviewEdit || (() => {})}
              isEnabled={isVisualEditorEnabled}
              iframeRef={previewIframeRef}
            />
          </>
        )}
        {view === 'preview' && (
          <PreviewVisualEditor
            htmlContent={displayHtml}
            onPreviewEdit={onPreviewEdit || (() => {})}
            isEnabled={isVisualEditorEnabled}
            iframeRef={previewIframeRef}
          />
        )}
        {view === 'code' && (
          <div className="h-full w-full">
            {/* Desktop: Resizable horizontal panel */}
            <div className="hidden md:flex h-full">
              <ResizablePanel direction="horizontal" initialSize={250} minSize={150}>
                <FileExplorer files={files} activeFile={activeFile} onSelectFile={onSelectFile} />
                <CodeEditor
                  filePath={activeFile}
                  code={files[activeFile] || ''}
                  onCodeChange={onCodeChange}
                />
              </ResizablePanel>
            </div>
            {/* Mobile: Vertical stack */}
            <div className="md:hidden flex flex-col h-full">
              <div className="h-2/5 border-b border-white/10 overflow-hidden">
                <FileExplorer files={files} activeFile={activeFile} onSelectFile={onSelectFile} />
              </div>
              <div className="h-3/5">
                <CodeEditor
                  filePath={activeFile}
                  code={files[activeFile] || ''}
                  onCodeChange={onCodeChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPreviewPanel;