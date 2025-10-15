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
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
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
}) => {
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Database state management
  const [databaseTables, setDatabaseTables] = useState<DatabaseTable[]>([
    {
      id: 'users',
      name: 'users',
      x: 100,
      y: 100,
      width: 250,
      height: 200,
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
        { name: 'email', type: 'varchar(255)', nullable: false, unique: true },
        { name: 'name', type: 'varchar(100)', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false }
      ],
      rowCount: 1250
    },
    {
      id: 'projects',
      name: 'projects',
      x: 400,
      y: 100,
      width: 250,
      height: 180,
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'name', type: 'varchar(200)', nullable: false },
        { name: 'status', type: 'varchar(50)', nullable: false }
      ],
      rowCount: 89
    },
    {
      id: 'messages',
      name: 'messages',
      x: 700,
      y: 100,
      width: 250,
      height: 160,
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, nullable: false },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'content', type: 'text', nullable: false },
        { name: 'role', type: 'varchar(50)', nullable: false }
      ],
      rowCount: 2341
    }
  ]);

  const [databaseRelationships] = useState<DatabaseRelationship[]>([
    {
      id: 'user-projects',
      fromTable: 'users',
      fromColumn: 'id',
      toTable: 'projects',
      toColumn: 'user_id',
      type: 'one-to-many'
    },
    {
      id: 'project-messages',
      fromTable: 'projects',
      fromColumn: 'id',
      toTable: 'messages',
      toColumn: 'project_id',
      type: 'one-to-many'
    }
  ]);

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  // Database handlers
  const handleTableSelect = (table: DatabaseTable) => {
    setSelectedTable(table.id);
  };

  const handleTableMove = (tableId: string, x: number, y: number) => {
    setDatabaseTables(prev => prev.map(table =>
      table.id === tableId ? { ...table, x, y } : table
    ));
  };

  const handleTableEdit = (updatedTable: DatabaseTable) => {
    setDatabaseTables(prev => prev.map(table =>
      table.id === updatedTable.id ? updatedTable : table
    ));
  };

  const handleTableDelete = (tableId: string) => {
    setDatabaseTables(prev => prev.filter(table => table.id !== tableId));
  };

  const handleAddTable = () => {
    // Create a copy of the users table (first table)
    const sourceTable = databaseTables.find(t => t.id === 'users');
    if (sourceTable) {
      const newTable: DatabaseTable = {
        id: `table_${Date.now()}`,
        name: `${sourceTable.name}_copy_${Math.floor(Math.random() * 1000)}`,
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        width: 250,
        height: 150,
        columns: JSON.parse(JSON.stringify(sourceTable.columns)), // Deep copy
        rowCount: 0
      };
      setDatabaseTables(prev => [...prev, newTable]);
      console.log('Added new table:', newTable.name);
    } else {
      console.log('No source table found to copy');
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
    return (
      <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
        <div className="flex-grow overflow-hidden">
          <DatabaseCanvas
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