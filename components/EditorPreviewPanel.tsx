import React, { useState, useEffect, useRef } from 'react';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import LivePreview, { Device } from './LivePreview';
import VisualEditor from './VisualEditor';
import PreviewVisualEditor from './PreviewVisualEditor';
import DatabaseCanvas from './DatabaseCanvas';
import DatabaseTable from './DatabaseTable';
import { Icon } from './Icon';
import type { Files, ConsoleMessage, PreviewChange } from '../types';
import type { DatabaseTable as DBTable, DatabaseConfig } from '../services/databaseService';
import { features, dbService } from '../services/serviceManager';
import ResizablePanel from './ResizablePanel';

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
   // Database props
   databaseTables?: DBTable[];
   databaseConfig?: DatabaseConfig;
   onDatabaseConnect?: () => void;
   onDatabaseTableSelect?: (table: DBTable) => void;
   onDatabaseRecordAdd?: (tableId: string, record: Record<string, any>) => void;
   onDatabaseRecordUpdate?: (tableId: string, recordId: string, updates: Record<string, any>) => void;
   onDatabaseRecordDelete?: (tableId: string, recordId: string) => void;
   selectedDatabaseTable?: string;
   isDatabaseConnected?: boolean;
   isDatabaseLoading?: boolean;
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
  // Database props
  databaseTables,
  databaseConfig,
  onDatabaseConnect,
  onDatabaseTableSelect,
  onDatabaseRecordAdd,
  onDatabaseRecordUpdate,
  onDatabaseRecordDelete,
  selectedDatabaseTable,
  isDatabaseConnected,
  isDatabaseLoading,
}) => {

  const previewIframeRef = useRef<HTMLIFrameElement>(null);

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

  // Database View Content
  if (view === 'database') {
    return (
      <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
        <div className="flex-grow overflow-auto">
          {features.mockMode ? (
            /* Mock Database UI */
            <div className="flex-grow p-6 overflow-auto">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <Icon name="database" className="w-8 h-8 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">Demo Database</h2>
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full">DEMO MODE</span>
                </div>

                <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-500/30 mb-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-white mb-2">Interactive Database Demo</h3>
                    <p className="text-gray-300 text-sm">
                      Experience full database management with mock data. All operations are simulated.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <Icon name="table" className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">2</div>
                      <div className="text-sm text-gray-400">Tables</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <Icon name="users" className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">1,250</div>
                      <div className="text-sm text-gray-400">Records</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <Icon name="zap" className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">99.9%</div>
                      <div className="text-sm text-gray-400">Uptime</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => onDatabaseAction && onDatabaseAction('create')}
                      className="w-full p-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="plus" className="w-4 h-4" />
                      Create New Table
                    </button>
                    <button
                      onClick={() => onDatabaseAction && onDatabaseAction('schema')}
                      className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="code" className="w-4 h-4" />
                      Generate Schema
                    </button>
                    <button
                      onClick={() => onDatabaseAction && onDatabaseAction('export')}
                      className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="download" className="w-4 h-4" />
                      Export Data
                    </button>
                  </div>
                </div>

                {/* Mock Tables Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Database Tables</h3>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">users</h4>
                      <span className="text-sm text-gray-400">1,250 records</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">id</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">email</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">name</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">created_at</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-gray-300">user_001</td>
                            <td className="py-2 px-3 text-gray-300">john@example.com</td>
                            <td className="py-2 px-3 text-gray-300">John Doe</td>
                            <td className="py-2 px-3 text-gray-300">2024-01-15</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-gray-300">user_002</td>
                            <td className="py-2 px-3 text-gray-300">jane@example.com</td>
                            <td className="py-2 px-3 text-gray-300">Jane Smith</td>
                            <td className="py-2 px-3 text-gray-300">2024-01-20</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">projects</h4>
                      <span className="text-sm text-gray-400">89 records</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">id</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">name</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">status</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">created_at</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-gray-300">proj_001</td>
                            <td className="py-2 px-3 text-gray-300">Portfolio Website</td>
                            <td className="py-2 px-3 text-green-400">published</td>
                            <td className="py-2 px-3 text-gray-300">2024-01-16</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-gray-300">proj_002</td>
                            <td className="py-2 px-3 text-gray-300">E-commerce Store</td>
                            <td className="py-2 px-3 text-yellow-400">draft</td>
                            <td className="py-2 px-3 text-gray-300">2024-01-25</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-sm text-gray-400 text-center">
                  <p>🎭 This is a demo database with simulated data and operations.</p>
                  <p className="mt-1">Publish to Vercel to get your own real database!</p>
                </div>
              </div>
            </div>
          ) : (
            /* Real Database UI */
            <>
              {isDatabaseConnected && databaseTables ? (
                <div className="h-full">
                  {/* Database Canvas View */}
                  {!selectedDatabaseTable && (
                    <DatabaseCanvas
                      tables={databaseTables}
                      onTableSelect={onDatabaseTableSelect}
                      selectedTable={selectedDatabaseTable}
                      className="h-full"
                    />
                  )}

                  {/* Individual Table View */}
                  {selectedDatabaseTable && databaseTables.find(t => t.id === selectedDatabaseTable) && (
                    <DatabaseTable
                      table={databaseTables.find(t => t.id === selectedDatabaseTable)!}
                      onRecordAdd={onDatabaseRecordAdd}
                      onRecordUpdate={onDatabaseRecordUpdate}
                      onRecordDelete={onDatabaseRecordDelete}
                      onRefresh={(tableId) => {
                        // Refresh logic will be implemented
                        console.log('Refresh table:', tableId);
                      }}
                      isLoading={isDatabaseLoading}
                      className="h-full"
                    />
                  )}
                </div>
              ) : (
                /* Database Connection UI */
                <div className="flex-grow p-6 overflow-auto">
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-6">MominAI Cloud Database</h2>

                    {!isDatabaseConnected ? (
                      <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-8 border border-blue-500/30">
                        <div className="text-center mb-6">
                          <Icon name="database" className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-white mb-2">MominAI Cloud Database</h3>
                          <p className="text-gray-300">
                            Publish your app to Vercel first, then connect your database to your own cloud infrastructure.
                          </p>
                        </div>

                        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4 mb-6">
                          <div className="flex items-start gap-3">
                            <Icon name="alert-triangle" className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-200">
                              <p className="font-semibold mb-1">Important: Publish First</p>
                              <p>You must publish your app to Vercel before connecting the database. This ensures your database is hosted in your own Vercel account.</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <button
                            onClick={() => onDatabaseAction && onDatabaseAction('generate-schema')}
                            className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-3"
                            disabled={isDatabaseLoading}
                          >
                            <Icon name="zap" className="w-5 h-5" />
                            {isDatabaseLoading ? 'Generating Schema...' : 'Generate Database Schema'}
                          </button>

                          <button
                            onClick={onDatabaseConnect}
                            className="w-full p-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-3"
                            disabled={isDatabaseLoading || !databaseConfig}
                          >
                            <Icon name="cloud" className="w-5 h-5" />
                            {isDatabaseLoading ? 'Connecting...' : 'Connect to Your Cloud'}
                          </button>
                        </div>

                        <div className="mt-6 text-sm text-gray-400">
                          <p className="mb-2">✨ <strong>New Workflow:</strong></p>
                          <ol className="list-decimal list-inside space-y-1 text-left">
                            <li>Publish your app to Vercel (creates your cloud account)</li>
                            <li>MominAI analyzes your website HTML</li>
                            <li>Generates optimal database schema</li>
                            <li>Creates PostgreSQL tables in YOUR Vercel account</li>
                            <li>Provides visual database management</li>
                          </ol>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-green-400">
                        <Icon name="check-circle" className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Database Connected!</h3>
                        <p>Your database is ready for use.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
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